'use client';

import React, { useState, useEffect } from 'react';
import {
    EncounterRecord,
    getDecryptedRecords,
    subscribeToStatus,
    PatientRecord,
    GenericResource,
    FHIRMedicationRequest,
    FHIRServiceRequest
} from '@/lib/storage';
import {
    Calendar,
    Stethoscope,
    Pill,
    TestTube,
    User,
    Search,
    ChevronDown,
    ChevronUp,
    FileText,
    Activity
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

export default function RekamMedisPage() {
    const [patients, setPatients] = useState<PatientRecord[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Load Patients List
        const fetchPatients = () => {
            const data = getDecryptedRecords('patient') as PatientRecord[];
            setPatients(data);
        };
        fetchPatients();
        subscribeToStatus(fetchPatients);
    }, []);

    useEffect(() => {
        if (selectedPatientId) {
            setLoading(true);
            const fetchHistory = () => {
                // 1. Get Encounters
                const encounters = (getDecryptedRecords('encounter') as EncounterRecord[])
                    .filter(e => e.patientId === selectedPatientId && e.status === 'finished')
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                // 2. Get Related Resources (Meds & Orders)
                const meds = getDecryptedRecords('medication') as GenericResource<FHIRMedicationRequest>[];
                const orders = getDecryptedRecords('service_request') as GenericResource<FHIRServiceRequest>[];

                // 3. Assemble Timeline
                const timeline = encounters.map(enc => {
                    const encMeds = meds.filter(m => m.data.subject.reference.includes(enc.patientId) &&
                        // Rough approximation: match date or just show all for this patient for now as we don't strict link Encounter ID in FHIR simulation yet
                        new Date(m.timestamp).toDateString() === new Date(enc.timestamp).toDateString()
                    );

                    const encOrders = orders.filter(o => o.data.subject.reference.includes(enc.patientId) &&
                        new Date(o.timestamp).toDateString() === new Date(enc.timestamp).toDateString()
                    );

                    return {
                        ...enc,
                        medications: encMeds,
                        orders: encOrders
                    };
                });

                setHistory(timeline);
                setLoading(false);
            };

            fetchHistory();
        } else {
            setHistory([]);
        }
    }, [selectedPatientId]);

    const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans flex flex-col md:flex-row gap-8">

            {/* Sidebar: Patient Picker */}
            <div className="w-full md:w-80 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-100px)] flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-slate-50">
                        <h2 className="font-bold text-slate-800 mb-2">Pilih Pasien</h2>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                placeholder="Cari MRN / Nama..."
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {filteredPatients.map(p => (
                            <div
                                key={p.id}
                                onClick={() => setSelectedPatientId(p.id)}
                                className={`p-3 rounded-xl cursor-pointer transition-colors border mb-2 ${selectedPatientId === p.id
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                            >
                                <p className="font-bold text-slate-900">{p.name}</p>
                                <p className="text-xs text-slate-500">MRN: {p.id.substring(0, 8)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content: Timeline */}
            <div className="flex-1">
                {selectedPatientId ? (
                    <div className="max-w-3xl">
                        <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-600" />
                            Riwayat Medis (CPPT)
                        </h1>

                        {loading ? <TableSkeleton /> : history.length === 0 ? (
                            <EmptyState title="Belum Ada Riwayat" description="Pasien ini belum memiliki riwayat pemeriksaan selesai." icon={FileText} />
                        ) : (
                            <div className="space-y-8 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:contents-[''] before:w-0.5 before:bg-slate-200">
                                {history.map((record, idx) => (
                                    <div key={record.id} className="relative pl-20 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                        {/* Timeline Dot */}
                                        <div className="absolute left-[26px] top-6 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white shadow-sm z-10"></div>

                                        {/* Date Label */}
                                        <div className="absolute left-0 top-6 w-20 text-right pr-6">
                                            <p className="font-bold text-slate-900 text-sm">{new Date(record.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                                            <p className="text-xs text-slate-400">{new Date(record.timestamp).getFullYear()}</p>
                                            <p className="text-xs text-slate-400 mt-1 font-mono">{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>

                                        {/* Card */}
                                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-all">
                                            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase tracking-wider">
                                                        {record.class === 'AMB' ? 'Rawat Jalan' : (record.class === 'IMP' ? 'Rawat Inap' : 'IGD')}
                                                    </div>
                                                    <h3 className="font-bold text-slate-800 text-sm">Poli Umum</h3>
                                                </div>
                                                <User className="w-4 h-4 text-slate-400" />
                                            </div>

                                            <div className="p-6 grid gap-6">
                                                {/* SOAP */}
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                                                <Stethoscope className="w-3 h-3" /> Subjective
                                                            </label>
                                                            <p className="text-slate-700 leading-relaxed text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 italic">"{record.soap.s}"</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                                                <Activity className="w-3 h-3" /> Objective
                                                            </label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {Object.entries(record.vitalSigns || {}).map(([Key, Val]) => (
                                                                    Val ? <span key={Key} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-100 font-mono">
                                                                        {Key}: <span className="font-bold">{String(Val)}</span>
                                                                    </span> : null
                                                                ))}
                                                                <span className="text-sm text-slate-600">{record.soap.o}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                                                <FileText className="w-3 h-3" /> Assessment
                                                            </label>
                                                            <p className="text-slate-900 font-bold border-l-4 border-orange-400 pl-3 py-1 bg-orange-50/50 rounded-r">
                                                                {record.soap.a || 'Belum ada diagnosa'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                                                <Activity className="w-3 h-3" /> Plan
                                                            </label>
                                                            <p className="text-slate-700 text-sm">{record.soap.p}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Orders Section */}
                                                {(record.medications.length > 0 || record.orders.length > 0) && (
                                                    <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                                                        {record.medications.length > 0 && (
                                                            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                                                                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                                    <Pill className="w-3 h-3" /> Resep Obat
                                                                </h4>
                                                                <div className="space-y-1">
                                                                    {record.medications.map((m: any, i: number) => (
                                                                        <div key={i} className="flex justify-between text-sm text-slate-700 px-2">
                                                                            <span>{m.data.medicationCodeableConcept.text}</span>
                                                                            <span className="font-mono text-slate-500">{m.data.dosageInstruction[0].text}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {record.orders.length > 0 && (
                                                            <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100/50">
                                                                <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                                                    <TestTube className="w-3 h-3" /> Order Penunjang
                                                                </h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {record.orders.map((o: any, i: number) => (
                                                                        <span key={i} className="px-2 py-1 bg-white border border-purple-200 rounded text-xs text-purple-800 font-medium shadow-sm">
                                                                            {o.data.code.text}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 mt-20">
                        <Search className="w-16 h-16 mb-4 text-slate-200" />
                        <h2 className="text-xl font-bold text-slate-300">Pilih Pasien</h2>
                        <p className="text-sm">Pilih pasien di sebelah kiri untuk melihat rekam medis.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
