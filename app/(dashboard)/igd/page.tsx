'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
    Siren,
    Activity,
    HeartPulse,
    Thermometer,
    ArrowRight,
    Users,
    Clock,
    UserPlus,
    AlertTriangle as AlertTriangleIcon
} from 'lucide-react';
import {
    getDecryptedRecords,
    saveEncounter,
    updateResourceStatus,
    subscribeToStatus,
    EncounterRecord,
    PatientRecord
} from '@/lib/storage'; // Assuming store exists
import { TableSkeleton } from '@/components/ui/TableSkeleton';

type TriageLevel = 'RESUS' | 'EMER' | 'NON'; // Red, Yellow, Green

export default function IGDTriagePage() {
    const [encounters, setEncounters] = useState<EncounterRecord[]>([]);
    const [patients, setPatients] = useState<PatientRecord[]>([]); // For simplified demo selection
    const [loading, setLoading] = useState(true);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [triageLevel, setTriageLevel] = useState<TriageLevel>('EMER');

    const { register, handleSubmit, reset } = useForm();

    const fetchQueue = () => {
        setLoading(true);
        // Get all Encounters that are Emergency class and active status
        const allEncounters = getDecryptedRecords('encounter') as EncounterRecord[];
        const igdQueue = allEncounters.filter(e =>
            e.class === 'EMER' &&
            ['triaged', 'arrived', 'in-progress'].includes(e.status)
        );
        setEncounters(igdQueue);

        // Also load patients for quick registration
        setPatients(getDecryptedRecords('patient') as PatientRecord[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchQueue();
        const unsubscribe = subscribeToStatus(fetchQueue);
        return () => unsubscribe();
    }, []);

    const onSubmit = async (data: any) => {
        if (!selectedPatientId) {
            toast.error("Pilih pasien terlebih dahulu!");
            return;
        }

        const patient = patients.find(p => p.id === selectedPatientId);
        if (!patient) return;

        try {
            await saveEncounter({
                patientId: patient.id,
                patientName: patient.name,
                class: 'EMER',
                status: 'triaged',
                soap: {
                    s: data.complaint,
                    o: `BP: ${data.bp} | HR: ${data.hr} | RR: ${data.rr} | Temp: ${data.temp}`,
                    a: `Triage: ${triageLevel}`,
                    p: 'Monitoring'
                },
                prescriptions: []
            });

            toast.success("Pasien masuk antrean Triage IGD");
            reset();
            setSelectedPatientId('');
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan data triage.");
        }
    };

    // Helper to extract triage from SOAP A (Mock Logic)
    const getTriageColor = (enc: EncounterRecord) => {
        const assessment = enc.soap.a || '';
        if (assessment.includes('RESUS')) return 'red';
        if (assessment.includes('EMER')) return 'yellow';
        return 'green';
    };

    const columns = [
        { id: 'red', title: 'Resusitasi', color: 'bg-red-50 text-red-900 border-red-200', borderColor: 'border-red-200', icon: Siren },
        { id: 'yellow', title: 'Emergent', color: 'bg-yellow-50 text-yellow-900 border-yellow-200', borderColor: 'border-yellow-200', icon: AlertTriangleIcon },
        { id: 'green', title: 'Non-Urgent', color: 'bg-green-50 text-green-900 border-green-200', borderColor: 'border-green-200', icon: Users },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        <Siren className="w-8 h-8 text-red-600 animate-pulse" />
                        IGD Triage Board
                    </h1>
                    <p className="text-slate-500 mt-1">Sistem prioritas penanganan pasien gawat darurat.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Triage Form */}
                <div className="xl:col-span-1">
                    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-slate-700" />
                            Input Triage Baru
                        </h2>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Pasien (Terdaftar)</label>
                            <select
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={selectedPatientId}
                                onChange={e => setSelectedPatientId(e.target.value)}
                            >
                                <option value="">-- Pilih Pasien --</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} - {p.nik}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Keluhan Utama</label>
                            <textarea
                                {...register('complaint')}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                rows={3}
                                placeholder="Nyeri dada, sesak nafas..."
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Tekanan Darah</label>
                                <input {...register('bp')} placeholder="120/80" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Nadi (HR)</label>
                                <input {...register('hr')} placeholder="80" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Nafas (RR)</label>
                                <input {...register('rr')} placeholder="20" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Suhu</label>
                                <input {...register('temp')} placeholder="36.5" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Level Triage</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTriageLevel('RESUS')}
                                    className={`p-2 rounded-lg text-xs font-bold border-2 transition-all ${triageLevel === 'RESUS' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    🔴 MERAH
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTriageLevel('EMER')}
                                    className={`p-2 rounded-lg text-xs font-bold border-2 transition-all ${triageLevel === 'EMER' ? 'bg-yellow-50 border-yellow-500 text-yellow-700' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    🟡 KUNING
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTriageLevel('NON')}
                                    className={`p-2 rounded-lg text-xs font-bold border-2 transition-all ${triageLevel === 'NON' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-200 text-slate-400'}`}
                                >
                                    🟢 HIJAU
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">
                            Masuk Antrean
                        </button>
                    </form>
                </div>

                {/* Kanban Board */}
                <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 h-fit">
                    {columns.map(col => (
                        <div key={col.id} className={`rounded-2xl border-2 ${col.borderColor} bg-white overflow-hidden flex flex-col h-[calc(100vh-200px)] shadow-sm`}>
                            <div className={`p-4 border-b ${col.borderColor} flex items-center justify-between ${col.color}`}>
                                <h3 className="font-bold flex items-center gap-2">
                                    <col.icon className="w-5 h-5" /> {col.title}
                                </h3>
                                <span className="bg-white/50 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold">
                                    {encounters.filter(e => getTriageColor(e) === col.id).length}
                                </span>
                            </div>
                            <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-slate-50/50">
                                {encounters
                                    .filter(e => getTriageColor(e) === col.id)
                                    .map(e => (
                                        <div key={e.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group animate-in slide-in-from-bottom-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-slate-900">{e.patientName}</h4>
                                                <span className="text-xs text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 line-clamp-2 mb-3 leading-relaxed">{e.soap.s}</p>

                                            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                <HeartPulse className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="font-mono font-medium">{e.soap.o.split('|')[0] || 'Vitals Pending'}</span>
                                            </div>

                                            <button className="mt-3 w-full py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                                Periksa Pasien &rarr;
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
