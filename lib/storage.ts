// lib/storage.ts
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface PatientRecord {
  id: string;
  name: string;
  nik: string;
  diagnosis: string;
  timestamp: string;
  isSynced: boolean;
}

let localDB: PatientRecord[] = [];
let SIMULATION_OFFLINE_MODE = false;

// Pastikan URL ini mengarah ke Mock Server nanti (bisa via env var atau localhost untuk tes)
// Saat di Docker, kita akan override ini lewat env variable
const CLOUD_URL = process.env.CLOUD_API_URL || 'http://localhost:8080/fhir/Bundle';

export const toggleOfflineMode = () => {
  SIMULATION_OFFLINE_MODE = !SIMULATION_OFFLINE_MODE;
  return SIMULATION_OFFLINE_MODE;
};

export const getStatus = () => ({
  totalLocal: localDB.length,
  unsynced: localDB.filter(p => !p.isSynced).length,
  isOffline: SIMULATION_OFFLINE_MODE
});

export const saveRecord = async (data: { name: string; nik: string; diagnosis: string }) => {
  const newRecord: PatientRecord = {
    id: uuidv4(),
    ...data,
    timestamp: new Date().toISOString(),
    isSynced: false, 
  };
  
  localDB.push(newRecord);
  await trySync(); // Auto-sync attempt
  return newRecord;
};

export const trySync = async () => {
  if (SIMULATION_OFFLINE_MODE) {
    console.log("🚫 [EDGE] Mode Offline Aktif. Sync ditahan.");
    return { status: 'offline', syncedCount: 0 };
  }

  const pendingRecords = localDB.filter(doc => !doc.isSynced);
  if (pendingRecords.length === 0) return { status: 'idle', syncedCount: 0 };

  console.log(`🔄 [EDGE] Mencoba sinkronisasi ${pendingRecords.length} data...`);
  let successCount = 0;

  for (const record of pendingRecords) {
    try {
      // Konversi ke format HL7 FHIR sederhana
      const fhirPayload = {
        resourceType: "Bundle",
        type: "transaction",
        entry: [
          {
            resource: {
              resourceType: "Patient",
              identifier: [{ system: "nik", value: record.nik }],
              name: [{ text: record.name }],
              meta: { lastUpdated: record.timestamp }
            },
            request: { method: "POST", url: "Patient" }
          }
        ]
      };

      // Kirim ke Cloud Mock Server
      await axios.post(CLOUD_URL, fhirPayload, { timeout: 3000 });
      
      record.isSynced = true; // Tandai sukses
      successCount++;
    } catch (error) {
      console.error(`❌ [EDGE] Gagal kirim ID ${record.id}. Retrying later.`);
    }
  }

  return { status: 'success', syncedCount: successCount };
};

export const getRecords = () => localDB;