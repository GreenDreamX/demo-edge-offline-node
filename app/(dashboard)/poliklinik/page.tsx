"use client";

import React, { useState, useEffect } from 'react';
import {
    getQueue,
    updateResourceStatus,
    saveMedicationRequest,
    EncounterRecord,
    PatientRecord,
    Prescription
} from '@/lib/storage';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
    User,
    Clock,
    Search,
    Plus,
    Trash2,
    Save,
    Stethoscope,
    Thermometer,
    Activity,
    CheckCircle,
    X,
    Heart,
    Weight
} from 'lucide-react';

// --- Hardcoded ICD-10 Data for Simulation ---
const ICD10_DATA = [
    { code: 'I10', name: 'Essential (primary) hypertension' },
    { code: 'J00', name: 'Acute nasopharyngitis [common cold]' },
    { code: 'E11', name: 'Type 2 diabetes mellitus' },
    { code: 'J06', name: 'Acute upper respiratory infections' },
    { code: 'K30', name: 'Functional dyspepsia' },
    { code: 'A09', name: 'Infectious gastroenteritis and colitis' },
    { code: 'M79.1', name: 'Myalgia' },
    { code: 'R50.9', name: 'Fever, unspecified' },
    { code: 'R51', name: 'Headache' },
    { code: 'J20.9', name: 'Acute bronchitis, unspecified' },
    { code: 'K29.7', name: 'Gastritis, unspecified' },
    { code: 'H10.9', name: 'Unspecified conjunctivitis' },
    { code: 'L20.9', name: 'Atopic dermatitis, unspecified' },
    { code: 'M54.5', name: 'Low back pain' },
    { code: 'Z00.0', name: 'General medical examination' },
    { code: 'R05', name: 'Cough' },
    { code: 'J45.9', name: 'Asthma, unspecified' },
    { code: 'E78.5', name: 'Hyperlipidemia, unspecified' },
    { code: 'K02.9', name: 'Dental caries, unspecified' },
    { code: 'B35.3', name: 'Tinea pedis' },
];

export default function PoliklinikPage() {
    const [queue, setQueue] = useState<EncounterRecord[]>([]);
    const [selectedEncounter, setSelectedEncounter] = useState<EncounterRecord | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    // Form State
    const [soap, setSoap] = useState({ s: '', o: '', a: '', p: '' });
    const [vitals, setVitals] = useState({ systolic: '', diastolic: '', heartRate: '', temperature: '', weight: '', height: '' });
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [prescriptionInput, setPrescriptionInput] = useState({ name: '', dosage: '' });

    useEffect(() => {
        // Load Queued Patients (Arrived / In-Progress)
        const fetchQueue = () => {
            setQueue(getQueue('Poli Umum'));
        };
        fetchQueue();

        // Poll every 5 seconds for simulation (or use the subscribeToStatus if we export it)
        const interval = setInterval(fetchQueue, 5000);
        return () => clearInterval(interval);
    }, []);

    const handlePatientSelect = (encounter: EncounterRecord) => {
        setSelectedEncounter(encounter);
        // Reset Form
        setSoap({ s: '', o: '', a: '', p: '' });
        setVitals({ systolic: '', diastolic: '', heartRate: '', temperature: '', weight: '', height: '' });
        setPrescriptions([]);
    };

    const addPrescription = () => {
        if (prescriptionInput.name && prescriptionInput.dosage) {
            setPrescriptions([...prescriptions, { medicationName: prescriptionInput.name, dosage: prescriptionInput.dosage }]);
            setPrescriptionInput({ name: '', dosage: '' });
        }
    };

    const removePrescription = (index: number) => {
        const newPrescriptions = [...prescriptions];
        newPrescriptions.splice(index, 1);
        setPrescriptions(newPrescriptions);
    };

    const handleSave = async () => {
        if (!selectedEncounter) return;
        setLoading(true);

        // 1. Update Encounter Status to 'finished' and Payment to 'unpaid'
        // This triggers Billing and removes from Poliklinik Queue
        // Also saves SOAP data
        const encounterUpdates = {
            status: 'finished',
            paymentStatus: 'unpaid',
            soap: soap,
            vitalSigns: {
                systolic: Number(vitals.systolic) || 0,
                diastolic: Number(vitals.diastolic) || 0,
                heartRate: Number(vitals.heartRate) || 0,
                temperature: Number(vitals.temperature) || 0,
                weight: Number(vitals.weight) || 0,
                height: Number(vitals.height) || 0,
            }
        };

        await updateResourceStatus(selectedEncounter.id, 'Encounter', encounterUpdates);

        // 2. Save Prescriptions (Trigger Farmasi)
        if (prescriptions.length > 0) {
            for (const p of prescriptions) {
                await saveMedicationRequest({
                    resourceType: "MedicationRequest",
                    status: "active",
                    intent: "order",
                    medicationCodeableConcept: { text: p.medicationName },
                    subject: { reference: `Patient/${selectedEncounter.patientId}`, display: selectedEncounter.patientName },
                    dosageInstruction: [{ text: p.dosage }],
                    authoredOn: new Date().toISOString()
                });
            }
        }

        toast.success("Pemeriksaan Selesai! Data dikirim ke Farmasi & Kasir.");

        setLoading(false);
        setSelectedEncounter(null); // Return to queue
        setQueue(getQueue('Poli Umum')); // Refresh queue immediately
    };

    const filteredQueue = queue.filter(e =>
        e.patientName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-6rem)] -m-6 overflow-hidden">

            {/* Left Sidebar - Queue List */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col z-10">
                <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                    <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Antrean Pasien
                    </h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari Nama / No. Antrean..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : filteredQueue.length === 0 ? (
                        <div className="h-full flex items-center justify-center p-4">
                            <EmptyState
                                icon={User}
                                title="Antrean Kosong"
                                description="Tidak ada pasien."
                            />
                        </div>
                    ) : (
                        filteredQueue.map(encounter => (
                            <div
                                key={encounter.id}
                                onClick={() => handlePatientSelect(encounter)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedEncounter?.id === encounter.id
                                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300'
                                    : 'bg-white border-gray-100 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-gray-900">{encounter.patientName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>{new Date(encounter.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${encounter.status === 'in-progress' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {encounter.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* Main Workspace */}
            <main className="flex-1 bg-gray-50 overflow-y-auto p-6">
                {selectedEncounter ? (
                    <div className="max-w-4xl mx-auto space-y-6">

                        {/* Patient Header */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center sticky top-0 z-20">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{selectedEncounter.patientName}</h1>
                                <p className="text-gray-500 text-sm flex gap-3 mt-1">
                                    <span>ID: {selectedEncounter.patientId.slice(0, 8)}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</span>
                                <p className="text-xl font-black text-blue-600 leading-none">{selectedEncounter.status.toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Subjective */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">S</div>
                                    <h3 className="font-bold text-gray-800">Subjective (Keluhan)</h3>
                                </div>
                                <textarea
                                    className="w-full h-32 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                                    placeholder="Catat keluhan pasien..."
                                    value={soap.s}
                                    onChange={e => setSoap({ ...soap, s: e.target.value })}
                                />
                            </div>

                            {/* Objective / Vitals */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center font-bold">O</div>
                                    <h3 className="font-bold text-gray-800">Objective (Tanda Vital)</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> Tekanan Darah</label>
                                        <div className="flex items-center gap-1">
                                            <input type="number" placeholder="120" className="w-full p-2 border rounded-lg text-center" value={vitals.systolic} onChange={e => setVitals({ ...vitals, systolic: e.target.value })} />
                                            <span className="text-gray-400">/</span>
                                            <input type="number" placeholder="80" className="w-full p-2 border rounded-lg text-center" value={vitals.diastolic} onChange={e => setVitals({ ...vitals, diastolic: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><Heart className="w-3 h-3" /> Detak Jantung</label>
                                        <div className="relative">
                                            <input type="number" className="w-full p-2 border rounded-lg" placeholder="80" value={vitals.heartRate} onChange={e => setVitals({ ...vitals, heartRate: e.target.value })} />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">bpm</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><Thermometer className="w-3 h-3" /> Suhu Tubuh</label>
                                        <div className="relative">
                                            <input type="number" className="w-full p-2 border rounded-lg" placeholder="36.5" value={vitals.temperature} onChange={e => setVitals({ ...vitals, temperature: e.target.value })} />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">°C</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1"><Weight className="w-3 h-3" /> Berat Badan</label>
                                        <div className="relative">
                                            <input type="number" className="w-full p-2 border rounded-lg" placeholder="60" value={vitals.weight} onChange={e => setVitals({ ...vitals, weight: e.target.value })} />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">kg</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold text-gray-500 mb-1">Catatan Fisik Lainnya</label>
                                        <input type="text" className="w-full p-2 border rounded-lg" placeholder="e.g. Pucat, lemas..." value={soap.o} onChange={e => setSoap({ ...soap, o: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {/* Assessment */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">A</div>
                                    <h3 className="font-bold text-gray-800">Assessment (Diagnosa ICD-10)</h3>
                                </div>
                                <select
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                                    value={soap.a}
                                    onChange={e => setSoap({ ...soap, a: e.target.value })}
                                >
                                    <option value="">-- Pilih Diagnosa --</option>
                                    {ICD10_DATA.map(d => (
                                        <option key={d.code} value={`${d.code} - ${d.name}`}>
                                            {d.code} - {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Plan */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-bold">P</div>
                                    <h3 className="font-bold text-gray-800">Plan & Resep</h3>
                                </div>
                                <textarea
                                    className="w-full h-20 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none resize-none mb-4"
                                    placeholder="Rencana tindak lanjut..."
                                    value={soap.p}
                                    onChange={e => setSoap({ ...soap, p: e.target.value })}
                                />

                                <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                                    <h4 className="text-sm font-bold text-gray-700">E-Resep</h4>
                                    <div className="flex gap-2">
                                        <input
                                            placeholder="Nama Obat"
                                            className="flex-1 p-2 text-sm border rounded-lg"
                                            value={prescriptionInput.name}
                                            onChange={e => setPrescriptionInput({ ...prescriptionInput, name: e.target.value })}
                                        />
                                        <input
                                            placeholder="Dosis (e.g. 3x1)"
                                            className="w-24 p-2 text-sm border rounded-lg"
                                            value={prescriptionInput.dosage}
                                            onChange={e => setPrescriptionInput({ ...prescriptionInput, dosage: e.target.value })}
                                        />
                                        <button
                                            onClick={addPrescription}
                                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {prescriptions.map((p, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white p-2 border rounded-lg text-sm">
                                                <span>{p.medicationName} <span className="text-gray-400">({p.dosage})</span></span>
                                                <button onClick={() => removePrescription(idx)} className="text-red-500 hover:text-red-700">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
                            >
                                <Save className="w-5 h-5" />
                                {loading ? 'Menyimpan...' : 'Selesai & Simpan'}
                            </button>
                        </div>

                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <Stethoscope className="w-16 h-16 mb-4 text-gray-200" />
                        <h2 className="text-xl font-bold text-gray-300">Pilih Pasien dari Antrean</h2>
                        <p className="text-sm">Klik nama pasien di sidebar kiri untuk memulai pemeriksaan.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
