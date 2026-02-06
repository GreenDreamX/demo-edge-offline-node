"use client";

import React, { useState, useEffect } from 'react';
import { Stethoscope, Plus, Trash2, Save, CheckCircle, AlertCircle, FileText, Search } from 'lucide-react';
import { saveEncounter, getRecords, PatientRecord, Prescription } from '@/lib/storage';

// Mock ICD-10 Data
const ICD10_MOCK = [
    { code: 'A00.1', name: 'Cholera due to Vibrio cholerae 01, biovar eltor' },
    { code: 'A01.0', name: 'Typhoid fever' },
    { code: 'A09', name: 'Infectious gastroenteritis and colitis, unspecified' },
    { code: 'I10', name: 'Essential (primary) hypertension' },
    { code: 'J00', name: 'Acute nasopharyngitis [common cold]' },
    { code: 'J06.9', name: 'Acute upper respiratory infection, unspecified' },
    { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications' },
    { code: 'R50.9', name: 'Fever, unspecified' },
    { code: 'K29.7', name: 'Gastritis, unspecified' },
    { code: 'R51', name: 'Headache' },
];

export default function OutpatientPage() {
    const [patients, setPatients] = useState<PatientRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Form State
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [soap, setSoap] = useState({
        s: '',
        o: '',
        a: ''
    });

    // Prescription State
    const [medName, setMedName] = useState('');
    const [medDose, setMedDose] = useState('');
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

    // ICD Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [showIcdDropdown, setShowIcdDropdown] = useState(false);

    useEffect(() => {
        // Load patients for dropdown
        setPatients(getRecords());
        // In a real app, we would fetch via API, but getRecords retrieves localDB which is synced with what we added in Registration
        // Since this is client-side only state demo, we might need to fetch via API if we want persistence across reloads in prod
        // For this demo, assuming getRecords returns the in-memory array.
        // To be safe, let's fetch from API to ensure we get what's "saved"
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const res = await fetch('/api/records');
            if (res.ok) {
                const data = await res.json();
                if (data.records) setPatients(data.records);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const addPrescription = () => {
        if (!medName || !medDose) return;
        setPrescriptions([...prescriptions, { medicationName: medName, dosage: medDose }]);
        setMedName('');
        setMedDose('');
    };

    const removePrescription = (index: number) => {
        const newDocs = [...prescriptions];
        newDocs.splice(index, 1);
        setPrescriptions(newDocs);
    };

    const handleIcdSelect = (icd: { code: string, name: string }) => {
        setSoap(prev => ({ ...prev, a: `${icd.code} - ${icd.name}` }));
        setSearchTerm(`${icd.code} - ${icd.name}`);
        setShowIcdDropdown(false);
    };

    const handleSubmit = async () => {
        if (!selectedPatientId || !soap.s || !soap.o || !soap.a) {
            alert('Mohon lengkapi data pasien dan SOAP (S-O-A wajib diisi).');
            return;
        }

        setLoading(true);
        setStatus('idle');

        try {
            const selectedPatient = patients.find(p => p.id === selectedPatientId);
            await saveEncounter({
                patientId: selectedPatientId,
                patientName: selectedPatient?.name || 'Unknown',
                soap: { ...soap, p: 'Lihat Resep & Tindakan' }, // P is derived or separate
                prescriptions: prescriptions
            });

            // Simulate API call delay
            setTimeout(() => {
                setStatus('success');
                setLoading(false);
                // Reset
                setSoap({ s: '', o: '', a: '' });
                setPrescriptions([]);
                setSearchTerm('');
                setSelectedPatientId('');

            }, 500);
        } catch (error) {
            console.error(error);
            setStatus('error');
            setLoading(false);
        }
    };

    const filteredIcd = ICD10_MOCK.filter(item =>
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pemeriksaan Poliklinik</h1>
                    <p className="text-slate-500 text-sm mt-1">E-Medical Record & E-Prescription dengan metode SOAP.</p>
                </div>
                <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 shadow-sm flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5" />
                    Dokter Umum
                </div>
            </div>

            {status === 'success' && (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="font-bold">Pemeriksaan Selesai!</p>
                        <p className="text-sm">Data Encounter, Condition, dan MedicationRequest telah tersimpan.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main SOAP Form */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Patient Selection */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Pasien (Dari Pendaftaran)</label>
                        <div className="relative">
                            <select
                                value={selectedPatientId}
                                onChange={(e) => setSelectedPatientId(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none bg-white"
                            >
                                <option value="">-- Cari Pasien --</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.nik} - {p.name}</option>
                                ))}
                            </select>
                            <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    {/* SOAP Inputs */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Catatan Medis (SOAP)</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Subjective */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-blue-700">
                                    <span className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-xs">S</span>
                                    Subjective (Keluhan)
                                </label>
                                <textarea
                                    value={soap.s}
                                    onChange={(e) => setSoap({ ...soap, s: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 resize-none"
                                    placeholder="Contoh: Demam sejak 3 hari lalu, pusing, mual..."
                                />
                            </div>

                            {/* Objective */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-blue-700">
                                    <span className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-xs">O</span>
                                    Objective (Pemeriksaan Fisik)
                                </label>
                                <textarea
                                    value={soap.o}
                                    onChange={(e) => setSoap({ ...soap, o: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 resize-none"
                                    placeholder="Contoh: TD 120/80, Suhu 38.5C, Nadi 88x/m..."
                                />
                            </div>

                            {/* Assessment */}
                            <div className="space-y-2 relative">
                                <label className="flex items-center gap-2 text-sm font-bold text-blue-700">
                                    <span className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-xs">A</span>
                                    Assessment (Diagnosa ICD-10)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setShowIcdDropdown(true);
                                            setSoap(prev => ({ ...prev, a: e.target.value })); // Allow free text too if needed
                                        }}
                                        onFocus={() => setShowIcdDropdown(true)}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Cari kode atau nama diagnosa..."
                                    />
                                    <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>

                                {showIcdDropdown && searchTerm && (
                                    <div className="absolute z-10 w-full bg-white mt-1 border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {filteredIcd.length > 0 ? (
                                            filteredIcd.map(icd => (
                                                <button
                                                    key={icd.code}
                                                    onClick={() => handleIcdSelect(icd)}
                                                    className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
                                                >
                                                    <span className="font-bold text-blue-700 w-16 inline-block">{icd.code}</span>
                                                    <span className="text-slate-700">{icd.name}</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-slate-500">Tidak ditemukan diagnosa yang cocok.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Plan & Prescription */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <label className="flex items-center gap-2 text-sm font-bold text-blue-700">
                                <span className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-xs">P</span>
                                Plan (Resep & Obat)
                            </label>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            <div className="space-y-4 mb-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Nama Obat</label>
                                    <input
                                        type="text"
                                        value={medName}
                                        onChange={(e) => setMedName(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 outline-none"
                                        placeholder="Paracetamol 500mg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Dosis / Aturan Pakai</label>
                                    <input
                                        type="text"
                                        value={medDose}
                                        onChange={(e) => setMedDose(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 outline-none"
                                        placeholder="3x1 sesudah makan"
                                    />
                                </div>
                                <button
                                    onClick={addPrescription}
                                    disabled={!medName || !medDose}
                                    className="w-full py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4" /> Tambah Obat
                                </button>
                            </div>

                            <div className="flex-1 border-t border-slate-100 pt-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Resep Saat Ini</h4>
                                {prescriptions.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic text-center py-4">Belum ada obat ditambahkan.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {prescriptions.map((p, idx) => (
                                            <li key={idx} className="flex justify-between items-start text-sm bg-slate-50 p-2 rounded border border-slate-100">
                                                <div>
                                                    <p className="font-semibold text-slate-800">{p.medicationName}</p>
                                                    <p className="text-slate-500 text-xs">{p.dosage}</p>
                                                </div>
                                                <button
                                                    onClick={() => removePrescription(idx)}
                                                    className="text-red-400 hover:text-red-600 p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            Simpan Pemeriksaan
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
