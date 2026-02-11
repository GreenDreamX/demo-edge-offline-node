// lib/storage.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';

// PouchDB.plugin(PouchDBFind); // Moved to init blocks

// --- Interfaces ---
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
    district: string;
    village: string;
  };
  diagnosis?: string;
  queueNumber?: string;
  timestamp: string;
  isSynced: boolean;
  resourceType: "Patient";
  _id?: string;
  _rev?: string;
}

export interface Prescription {
  medicationName: string;
  dosage: string;
}

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
  class: { code: string; display: string };
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
  summary: string;
  assessor?: { display: string };
}

export interface FHIRServiceRequest {
  resourceType: "ServiceRequest";
  status: "active" | "completed";
  intent: "order";
  code: { text: string };
  subject: { reference: string };
  authoredOn: string;
}

export interface EncounterRecord {
  id: string;
  patientId: string;
  patientName: string;
  soap: {
    s: string;
    o: string;
    a: string;
    p: string;
  };
  prescriptions: Prescription[];
  timestamp: string;
  isSynced: boolean;
  class: 'AMB' | 'EMER' | 'IMP';
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled';
  resourceType: "Encounter";
  paymentStatus?: 'unpaid' | 'paid';
  _id?: string;
  _rev?: string;
}

export interface GenericResource<T> {
  id: string;
  data: T;
  timestamp: string;
  isSynced: boolean;
  resourceType: string;
  _id?: string;
  _rev?: string;
}

export interface Bed {
  id: string;
  roomName: string;
  class: '1' | '2' | '3' | 'VIP' | 'VVIP' | 'Iso';
  status: 'occupied' | 'available' | 'cleaning' | 'maintenance';
  patientId?: string;
  patientName?: string;
  gender?: 'male' | 'female';
  _id?: string;
  _rev?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  batchNo: string;
  expiryDate: string;
  stock: number;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  supplier?: string;
  minStock?: number;
  _id?: string; // PouchDB ID
  _rev?: string;
}

export interface Invoice {
  id: string;
  encounterId: string;
  patientName: string;
  date: string;
  items: {
    id: string;
    description: string;
    amount: number;
    quantity: number;
  }[];
  total: number;
  status: 'paid' | 'unpaid' | 'cancelled';
  insuranceType: 'BPJS' | 'General' | 'Insurance';
  paymentMethod?: 'cash' | 'card' | 'qris';
  _id?: string;
  _rev?: string;
}

export interface FHIRDiagnosticReport {
  resourceType: "DiagnosticReport";
  status: "final" | "preliminary" | "amended";
  code: { text: string; coding?: any[] };
  subject: { reference: string; display?: string };
  encounter?: { reference: string };
  effectiveDateTime: string;
  performer?: { display: string }[];
  result?: { reference: string; display: string }[];
  presentedForm?: { contentType: string; url?: string; data?: string }[];
}

// --- PouchDB Initialization ---
let db: PouchDB.Database;

// Declare in-memory caches for UI reactivity
let localDB: PatientRecord[] = [];
let localEncounters: EncounterRecord[] = [];
let localMedicationRequests: GenericResource<FHIRMedicationRequest>[] = [];
let localClinicalImpressions: GenericResource<FHIRClinicalImpression>[] = [];
let localServiceRequests: GenericResource<FHIRServiceRequest>[] = [];
let localBeds: Bed[] = [];
let localDiagnosticReports: GenericResource<FHIRDiagnosticReport>[] = [];
let localInventory: InventoryItem[] = [];
let localInvoices: Invoice[] = [];

if (typeof window === 'undefined') {
  // Server Side (Node.js) - Mock DB for Build to pass
  // We can't easily rely on leveldb/pouchdb in Next.js build environment (Vercel/Docker build steps often fail on native bindings or FS permissions)
  // Since this is primarily a Client-Side Offline First app, we can mock server-side DB for now.
  console.log("Initializing Server-Side Mock DB");
  db = {
    get: async () => { throw { status: 404, message: 'Not found in mock' }; },
    put: async (doc: any) => ({ ok: true, id: doc._id || 'mock-id', rev: '1-mock' }),
    post: async (doc: any) => ({ ok: true, id: 'mock-id', rev: '1-mock' }),
    allDocs: async () => ({ rows: [] }),
    createIndex: async () => ({ result: 'created' }),
    destroy: async () => ({ ok: true }),
    close: async () => { },
    bulkDocs: async () => ([]),
    changes: () => ({ on: () => { } })
  } as unknown as PouchDB.Database;
} else {
  // Client Side (Browser)
  PouchDB.plugin(PouchDBFind);
  db = new PouchDB('simrs_local_db');
}

// Ensure Indexes
db.createIndex({
  index: { fields: ['resourceType', 'timestamp'] }
}).catch(console.error);


// --- Reactive Listeners ---
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

// Sync Cached Arrays with DB
const refreshCache = async () => {
  try {
    const allDocs = await db.allDocs({ include_docs: true });
    const docs = allDocs.rows.map(row => row.doc);

    // Filter by Type
    localDB = docs.filter((d: any) => d.resourceType === 'Patient') as unknown as PatientRecord[];
    localEncounters = docs.filter((d: any) => d.resourceType === 'Encounter') as unknown as EncounterRecord[];
    localMedicationRequests = docs.filter((d: any) => d.resourceType === 'MedicationRequest') as unknown as GenericResource<FHIRMedicationRequest>[];
    localClinicalImpressions = docs.filter((d: any) => d.resourceType === 'ClinicalImpression') as unknown as GenericResource<FHIRClinicalImpression>[];
    localServiceRequests = docs.filter((d: any) => d.resourceType === 'ServiceRequest') as unknown as GenericResource<FHIRServiceRequest>[];
    localDiagnosticReports = docs.filter((d: any) => d.resourceType === 'DiagnosticReport') as unknown as GenericResource<FHIRDiagnosticReport>[];
    localBeds = docs.filter((d: any) => (d as any).roomName !== undefined) as unknown as Bed[]; // Duck typing or add resourceType to Bed
    localInventory = docs.filter((d: any) => (d as any).batchNo !== undefined) as unknown as InventoryItem[];
    localInvoices = docs.filter((d: any) => (d as any).items !== undefined) as unknown as Invoice[];

    notifyListeners();
  } catch (error) {
    console.error("Failed to refresh cache:", error);
  }
};

// Initial Load - Defer to avoid build/import side-effects blocking
if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'production') {
  // Only auto-refresh immediately in dev or client
  // In production build, we might want to avoid this side effect
  refreshCache();
} else {
  // In prod server, maybe we want to wait request?
  // Let's just run it but catch error silently
  refreshCache().catch(e => console.error("Initial cache refresh failed", e));
}

// --- CRUD Operations ---

// Helper to save generic
const saveToDB = async (doc: any) => {
  doc._id = doc.id; // Use UUID as PouchDB _id
  try {
    await db.put(doc);
    await refreshCache();
    return doc;
  } catch (err: any) {
    if (err.status === 409) {
      // Update conflict - get latest rev
      const existing = await db.get(doc.id);
      doc._rev = existing._rev;
      await db.put(doc);
      await refreshCache();
      return doc;
    }
    throw err;
  }
};

export const getDecryptedRecords = (type: string = 'patient') => {
  switch (type) {
    case 'patient': return localDB;
    case 'encounter': return localEncounters;
    case 'medication': return localMedicationRequests;
    case 'clinical_impression': return localClinicalImpressions;
    case 'service_request': return localServiceRequests;
    case 'bed': return localBeds;
    case 'diagnostic_report': return localDiagnosticReports;
    case 'inventory': return localInventory;
    case 'invoice': return localInvoices;
    default: return localDB;
  }
};

// Specific Savers
export const saveMedicalRecord = async (data: Omit<PatientRecord, 'id' | 'timestamp' | 'isSynced' | 'queueNumber' | 'resourceType'>) => {
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
  return await saveToDB(newRecord);
};

export const saveEncounter = async (data: Omit<EncounterRecord, 'id' | 'timestamp' | 'isSynced' | 'resourceType'>) => {
  const newEncounter: EncounterRecord = {
    id: uuidv4(),
    ...data,
    timestamp: new Date().toISOString(),
    isSynced: false,
    resourceType: "Encounter",
    paymentStatus: data.paymentStatus || 'unpaid'
  };
  await saveToDB(newEncounter);

  if (data.prescriptions && data.prescriptions.length > 0) {
    for (const p of data.prescriptions) {
      await saveMedicationRequest({
        resourceType: "MedicationRequest",
        status: "active",
        intent: "order",
        medicationCodeableConcept: { text: p.medicationName },
        subject: { reference: `Patient/${data.patientId}`, display: data.patientName },
        dosageInstruction: [{ text: p.dosage }],
        authoredOn: new Date().toISOString()
      });
    }
  }
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
  return await saveToDB(newRecord);
};

export const saveServiceRequest = async (data: FHIRServiceRequest) => {
  const newRecord: GenericResource<FHIRServiceRequest> = {
    id: uuidv4(),
    data: data,
    timestamp: new Date().toISOString(),
    isSynced: false,
    resourceType: "ServiceRequest"
  };
  return await saveToDB(newRecord);
};

export const saveDiagnosticReport = async (data: FHIRDiagnosticReport) => {
  const newRecord: GenericResource<FHIRDiagnosticReport> = {
    id: uuidv4(),
    data: data,
    timestamp: new Date().toISOString(),
    isSynced: false,
    resourceType: "DiagnosticReport"
  };
  return await saveToDB(newRecord);
};

export const saveClinicalImpression = async (data: FHIRClinicalImpression) => {
  const newRecord: GenericResource<FHIRClinicalImpression> = {
    id: uuidv4(),
    data: data,
    timestamp: new Date().toISOString(),
    isSynced: false,
    resourceType: "ClinicalImpression"
  };
  return await saveToDB(newRecord);
};

export const saveBed = async (data: Omit<Bed, 'id'>) => {
  const newRecord: Bed = {
    id: uuidv4(),
    ...data
  };
  // Mark as bed typ
  (newRecord as any).resourceType = 'Bed'; // Helper for filtering
  return await saveToDB(newRecord);
};

export const saveInventory = async (data: Omit<InventoryItem, 'id'>) => {
  const newRecord: InventoryItem = {
    id: uuidv4(),
    ...data
  };
  (newRecord as any).resourceType = 'Inventory';
  return await saveToDB(newRecord);
};

export const saveInvoice = async (data: Invoice) => {
  const inv = { ...data, resourceType: 'Invoice' };
  return await saveToDB(inv);
};

// Updates
export const updateResourceStatus = async (id: string, resourceType: string, updates: any) => {
  try {
    const doc = await db.get(id);
    if (resourceType === 'ServiceRequest' || resourceType === 'MedicationRequest') {
      // Wrapper structure
      (doc as any).data = { ...(doc as any).data, ...updates };
    } else {
      Object.assign(doc, updates);
    }
    await db.put(doc);
    await refreshCache();
    return doc;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const updateStock = async (id: string, quantityChange: number) => {
  try {
    const item = await db.get(id) as any;
    item.stock += quantityChange;
    await db.put(item);
    await refreshCache();
  } catch (e) { console.error(e); }
};

export const updateMedicationStatus = async (id: string, status: 'completed' | 'cancelled') => {
  try {
    const doc = await db.get(id) as any;
    doc.data.status = status;
    await db.put(doc);
    await refreshCache();
  } catch (e) { console.error(e); }
};

export const updateBedStatus = async (id: string, status: 'occupied' | 'available' | 'cleaning' | 'maintenance', patientId?: string, patientName?: string) => {
  try {
    const doc = await db.get(id) as any;
    doc.status = status;
    if (status === 'occupied') {
      doc.patientId = patientId;
      doc.patientName = patientName;
    } else {
      delete doc.patientId;
      delete doc.patientName;
    }
    await db.put(doc);
    await refreshCache();
  } catch (e) { console.error(e); }
};

// Queries
export const getQueue = (poli: string): EncounterRecord[] => {
  return localEncounters.filter(e =>
    e.class === 'AMB' &&
    (e.status === 'arrived' || e.status === 'in-progress' || e.status === 'triaged')
  );
};

export const getPrescriptions = (status: 'active' | 'completed'): GenericResource<FHIRMedicationRequest>[] => {
  return localMedicationRequests.filter(m => m.data.status === status);
};

export const getUnpaidInvoices = (): EncounterRecord[] => {
  return localEncounters.filter(e => e.paymentStatus !== 'paid' && e.status === 'finished');
};

// Helper for Offline Toggle
export const toggleOfflineMode = () => {
  // In PouchDB logic, we might just stop syncing
  // For now, let's just return true/false dummy
  return false;
};

export const getStatus = () => {
  // Return sync status stats
  return {
    unsynced: 0, // Calculate from un-synced docs if needed
    isOffline: false,
    totalLocal: localDB.length + localEncounters.length // Rough estimate
  };
};

// Simulation Cloud Sync (Stub)
const CLOUD_URL = process.env.CLOUD_API_URL || 'http://localhost:8080/fhir/Bundle';

export const trySync = async () => {
  // simplified
  notifyListeners();
  return { status: 'idle', syncedCount: 0 };
};

export const resetDatabase = async () => {
  try {
    await db.destroy();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  } catch (e) {
    console.error("Failed to reset database", e);
  }
};
