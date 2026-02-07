// lib/storage.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
// import PouchDB from 'pouchdb'; // Lazy loaded

export interface PatientRecord {
  id: string;
  name: string;
  nik: string;
  gender: string;
  birthDate: string;
  phone: string;
  address: {
    line: string;
    city: string;
    district: string; // Kecamatan
    village: string; // Kelurahan
  };
  diagnosis?: string;
  queueNumber?: string;
  timestamp: string;
  isSynced: boolean;
  resourceType: "Patient";
}

export interface Prescription {
  medicationName: string;
  dosage: string;
}

// FHIR Interface Expansions
export interface FHIRObservation {
  resourceType: "Observation";
  status: "final" | "amended" | "corrected";
  code: { text: string; coding?: any[] };
  valueString?: string;
  valueQuantity?: { value: number; unit: string };
  subject: { reference: string };
  effectiveDateTime: string;
}

export interface FHIRCondition {
  resourceType: "Condition";
  clinicalStatus: { coding: [{ system: string; code: string }] };
  verificationStatus: { coding: [{ system: string; code: string }] };
  code: { text: string; coding?: any[] };
  subject: { reference: string };
  note?: [{ text: string }];
}

export interface FHIREncounter {
  resourceType: "Encounter";
  status: "finished" | "in-progress" | "planned" | "arrived" | "triaged" | "onleave";
  class: { code: string; display: string }; // AMB, EMER, IMP
  subject: { reference: string; display: string };
  period: { start: string; end?: string };
}

export interface FHIRMedicationRequest {
  resourceType: "MedicationRequest";
  status: "active" | "completed" | "cancelled" | "draft";
  intent: "order";
  medicationCodeableConcept: { text: string };
  subject: { reference: string; display?: string };
  dosageInstruction: [{ text: string }];
  authoredOn: string;
}

export interface FHIRClinicalImpression {
  resourceType: "ClinicalImpression";
  status: "in-progress" | "completed";
  subject: { reference: string; display?: string };
  encounter?: { reference: string };
  effectiveDateTime: string;
  summary: string; // The CPPT note content
  assessor?: { display: string };
}

export interface FHIRServiceRequest {
  resourceType: "ServiceRequest";
  status: "active" | "completed";
  intent: "order";
  code: { text: string }; // e.g., "Transfer to Inpatient"
  subject: { reference: string };
  authoredOn: string;
}

export interface EncounterRecord {
  id: string;
  patientId: string;
  patientName: string; // Denormalized for easier display
  soap: {
    s: string;
    o: string;
    a: string; // ICD-10 Code + Name
    p: string;
  };
  prescriptions: Prescription[];
  timestamp: string;
  isSynced: boolean;
  class: 'AMB' | 'EMER' | 'IMP';
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled';
  resourceType: "Encounter";
  paymentStatus?: 'unpaid' | 'paid';
}

// Generic wrapper for other resources stored locally
export interface GenericResource<T> {
  id: string;
  data: T;
  timestamp: string;
  isSynced: boolean;
  resourceType: string;
}

let localDB: PatientRecord[] = [];
let localEncounters: EncounterRecord[] = [];
let localMedicationRequests: GenericResource<FHIRMedicationRequest>[] = [];
let localClinicalImpressions: GenericResource<FHIRClinicalImpression>[] = [];
let localServiceRequests: GenericResource<FHIRServiceRequest>[] = [];

let SIMULATION_OFFLINE_MODE = false;

// Event Listener for UI updates
type Listener = () => void;
let listeners: Listener[] = [];

export const subscribeToStatus = (listener: Listener) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

const notifyListeners = () => {
  listeners.forEach(l => l());
};


// Pastikan URL ini mengarah ke Mock Server nanti (bisa via env var atau localhost untuk tes)
// Saat di Docker, kita akan override ini lewat env variable
const CLOUD_URL = process.env.CLOUD_API_URL || 'http://localhost:8080/fhir/Bundle';

export const toggleOfflineMode = () => {
  SIMULATION_OFFLINE_MODE = !SIMULATION_OFFLINE_MODE;
  notifyListeners();
  return SIMULATION_OFFLINE_MODE;
};

export const getStatus = () => {
  const unsyncedPatients = localDB.filter(p => !p.isSynced).length;
  const unsyncedEncounters = localEncounters.filter(e => !e.isSynced).length;
  const unsyncedMeds = localMedicationRequests.filter(m => !m.isSynced).length;
  const unsyncedClinical = localClinicalImpressions.filter(c => !c.isSynced).length;

  return {
    totalLocal: localDB.length,
    totalEncounters: localEncounters.length,
    unsynced: unsyncedPatients + unsyncedEncounters + unsyncedMeds + unsyncedClinical,
    isOffline: SIMULATION_OFFLINE_MODE,
    unsyncedPatients,
    unsyncedEncounters
  };
};

export const getDecryptedRecords = (type: 'patient' | 'encounter' | 'medication' | 'clinical_impression' = 'patient') => {
  switch (type) {
    case 'encounter': return localEncounters;
    case 'medication': return localMedicationRequests;
    case 'clinical_impression': return localClinicalImpressions;
    default: return localDB;
  }
};

// --- NEW QUERY FUNCTIONS ---

export const getQueue = (poli: string): EncounterRecord[] => {
  // Returns Encounters that are 'arrived' or 'in-progress'
  // In a real app we would filter by 'poli' (ServiceRequest locations), 
  // but for now we assume all 'AMB' (Ambulatory) or 'EMER' are relevant if checking purely by class.
  // For Poli Umum, we'll assume 'AMB'.
  return localEncounters.filter(e =>
    e.class === 'AMB' &&
    (e.status === 'arrived' || e.status === 'in-progress' || e.status === 'triaged')
  );
};

export const getPrescriptions = (status: 'active' | 'completed'): GenericResource<FHIRMedicationRequest>[] => {
  return localMedicationRequests.filter(m => m.data.status === status);
};

export const getUnpaidInvoices = (): EncounterRecord[] => {
  return localEncounters.filter(e => e.paymentStatus === 'unpaid');
};

export const updateResourceStatus = async (
  id: string,
  resourceType: 'Encounter' | 'MedicationRequest',
  updates: any
) => {
  // Since we are using in-memory arrays for this simulation, we update directly.
  // In PouchDB version, we would do db.get() -> db.put()

  let updated = false;

  if (resourceType === 'Encounter') {
    const idx = localEncounters.findIndex(e => e.id === id);
    if (idx !== -1) {
      localEncounters[idx] = { ...localEncounters[idx], ...updates, isSynced: false };
      updated = true;
    }
  } else if (resourceType === 'MedicationRequest') {
    const idx = localMedicationRequests.findIndex(m => m.id === id);
    if (idx !== -1) {
      // updates often map to 'data' in GenericResource
      localMedicationRequests[idx].data = { ...localMedicationRequests[idx].data, ...updates };
      localMedicationRequests[idx].isSynced = false;
      updated = true;
    }
  }

  if (updated) {
    notifyListeners();
    trySync();
    return true;
  }
  return false;
};

export const saveMedicalRecord = async (data: Omit<PatientRecord, 'id' | 'timestamp' | 'isSynced' | 'queueNumber' | 'resourceType'>) => {
  // Generate Queue Number Logic (Simple Counter for "Today")
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = localDB.filter(p => p.timestamp.startsWith(today));
  const queueNum = `A-${String(todayRecords.length + 1).padStart(3, '0')}`;

  const newRecord: PatientRecord = {
    id: uuidv4(),
    ...data,
    queueNumber: queueNum,
    timestamp: new Date().toISOString(),
    isSynced: false,
    resourceType: "Patient"
  };

  localDB.push(newRecord);
  notifyListeners();
  await trySync(); // Auto-sync attempt
  return newRecord;
};

export const saveEncounter = async (data: Omit<EncounterRecord, 'id' | 'timestamp' | 'isSynced' | 'resourceType'>) => {
  const newEncounter: EncounterRecord = {
    id: uuidv4(),
    ...data,
    timestamp: new Date().toISOString(),
    isSynced: false,
    resourceType: "Encounter",
    paymentStatus: data.paymentStatus || 'unpaid' // Default to unpaid if not set, though usually set on finish
  };

  localEncounters.push(newEncounter);

  // Also create MedicationRequests if prescriptions exist
  if (data.prescriptions && data.prescriptions.length > 0) {
    data.prescriptions.forEach(p => {
      saveMedicationRequest({
        resourceType: "MedicationRequest",
        status: "active",
        intent: "order",
        medicationCodeableConcept: { text: p.medicationName },
        subject: { reference: `Patient/${data.patientId}`, display: data.patientName },
        dosageInstruction: [{ text: p.dosage }],
        authoredOn: new Date().toISOString()
      });
    });
  }

  notifyListeners();
  await trySync();
  return newEncounter;
};

export const saveMedicationRequest = async (data: FHIRMedicationRequest) => {
  const newRecord: GenericResource<FHIRMedicationRequest> = {
    id: uuidv4(),
    data: data,
    timestamp: new Date().toISOString(),
    isSynced: false,
    resourceType: "MedicationRequest"
  };
  localMedicationRequests.push(newRecord);
  notifyListeners();
  return newRecord;
};

export const saveClinicalImpression = async (data: FHIRClinicalImpression) => {
  const newRecord: GenericResource<FHIRClinicalImpression> = {
    id: uuidv4(),
    data: data,
    timestamp: new Date().toISOString(),
    isSynced: false,
    resourceType: "ClinicalImpression"
  };
  localClinicalImpressions.push(newRecord);
  notifyListeners();
  return newRecord;
};

// Helper for Pharmacy to process prescription
export const updateMedicationStatus = (id: string, status: 'completed' | 'cancelled') => {
  const record = localMedicationRequests.find(r => r.id === id);
  if (record) {
    record.data.status = status;
    record.isSynced = false; // Need to sync the update
    notifyListeners();
    trySync();
  }
};

export const trySync = async () => {
  if (SIMULATION_OFFLINE_MODE) {
    console.log("🚫 [EDGE] Mode Offline Aktif. Sync ditahan.");
    notifyListeners();
    return { status: 'offline', syncedCount: 0 };
  }

  const pendingRecords = localDB.filter(doc => !doc.isSynced);
  const pendingEncounters = localEncounters.filter(enc => !enc.isSynced);
  const pendingMeds = localMedicationRequests.filter(m => !m.isSynced);
  const pendingClinical = localClinicalImpressions.filter(c => !c.isSynced);

  if (pendingRecords.length === 0 && pendingEncounters.length === 0 && pendingMeds.length === 0 && pendingClinical.length === 0) {
    notifyListeners();
    return { status: 'idle', syncedCount: 0 };
  }

  console.log(`🔄 [EDGE] Syncing: ${pendingRecords.length} Patients, ${pendingEncounters.length} Encounters, ${pendingMeds.length} Meds...`);
  let successCount = 0;

  // Sync Patients
  for (const record of pendingRecords) {
    try {
      const fhirPayload = {
        resourceType: "Bundle",
        type: "transaction",
        entry: [
          {
            resource: {
              resourceType: "Patient",
              identifier: [{ system: "nik", value: record.nik }],
              name: [{ text: record.name }],
              gender: record.gender === 'Laki-laki' ? 'male' : 'female',
              birthDate: record.birthDate,
              telecom: [{ system: 'phone', value: record.phone }],
              address: [{
                line: [record.address.line],
                city: record.address.city,
                district: record.address.district,
                text: `${record.address.line}, ${record.address.village}, ${record.address.district}, ${record.address.city}`
              }],
              meta: { lastUpdated: record.timestamp }
            },
            request: { method: "POST", url: "Patient" }
          }
        ]
      };
      await axios.post(CLOUD_URL, fhirPayload, { timeout: 3000 });
      record.isSynced = true;
      successCount++;
    } catch (error) {
      // consoles omitted for brevity
    }
  }

  // Sync Encounters
  for (const enc of pendingEncounters) {
    try {
      const bundleEntries: any[] = [
        {
          resource: {
            resourceType: "Encounter",
            status: enc.status,
            class: { code: enc.class, display: enc.class === 'AMB' ? 'ambulatory' : (enc.class === 'EMER' ? 'emergency' : 'inpatient') },
            subject: { reference: `Patient/${enc.patientId}`, display: enc.patientName },
            period: { start: enc.timestamp, end: enc.timestamp }
          } as FHIREncounter,
          request: { method: "POST", url: "Encounter" }
        }
      ];

      // Add Condition if exists
      if (enc.soap && enc.soap.a) {
        bundleEntries.push({
          resource: {
            resourceType: "Condition",
            code: { text: enc.soap.a },
            subject: { reference: `Patient/${enc.patientId}` },
            note: [{ text: `S: ${enc.soap.s} | O: ${enc.soap.o}` }]
          } as FHIRCondition,
          request: { method: "POST", url: "Condition" }
        });
      }

      const fhirPayload = { resourceType: "Bundle", type: "transaction", entry: bundleEntries };
      await axios.post(CLOUD_URL, fhirPayload, { timeout: 3000 });
      enc.isSynced = true;
      successCount++;
    } catch (error) { }
  }

  // Sync Medications
  for (const med of pendingMeds) {
    try {
      await axios.post(CLOUD_URL, med.data, { timeout: 3000 });
      med.isSynced = true;
      successCount++;
    } catch (e) { }
  }

  // Sync Clinical Impressions
  for (const imp of pendingClinical) {
    try {
      await axios.post(CLOUD_URL, imp.data, { timeout: 3000 });
      imp.isSynced = true;
      successCount++;
    } catch (e) { }
  }

  notifyListeners();
  return { status: 'success', syncedCount: successCount };
};



export const getRecords = () => localDB;

export const resetDatabase = async () => {
  // 1. Clear In-Memory
  localDB = [];
  localEncounters = [];
  localMedicationRequests = [];
  localClinicalImpressions = [];
  localServiceRequests = [];

  // 2. Clear Persistence (if active)
  try {
    const PouchDB = (await import('pouchdb')).default;
    await new PouchDB('simrs_main').destroy();
    await new PouchDB('simrs-offline').destroy();
    console.log('🔥 PouchDB Destroyed');
  } catch (e) {
    console.warn('Failed to destroy PouchDB', e);
  }

  // 3. Clear LocalStorage
  if (typeof window !== 'undefined') {
    localStorage.clear();
    console.log('🔥 LocalStorage Cleared');
  }
};
