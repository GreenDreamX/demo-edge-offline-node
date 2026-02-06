"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Ambulance, AlertTriangle, Activity, UserPlus, Clock, ArrowRight, Bed } from 'lucide-react';
import { getDecryptedRecords, subscribeToStatus, saveEncounter, EncounterRecord, PatientRecord, saveMedicalRecord } from '@/lib/storage'; // Adjusted import path

type TriageLevel = 'resus' | 'urgent' | 'non-urgent';

interface TriageForm {
    name: string;
    age: string;
    gender: 'male' | 'female';
    complaint: string;
    triageLevel: TriageLevel;
}

export default function IGDPage() {
    const [patients, setPatients] = useState<EncounterRecord[]>([]);
    const [showModal, setShowModal] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<TriageForm>();

    useEffect(() => {
        const fetchData = () => {
            const allEncounters = getDecryptedRecords('encounter') as EncounterRecord[];
            // Filter for Active Emergency Encounters
            const igdPatients = allEncounters.filter(e =>
                e.class === 'EMER' &&
                ['triaged', 'arrived', 'in-progress'].includes(e.status)
            );
            setPatients(igdPatients);
        };

        fetchData();
        const unsubscribe = subscribeToStatus(fetchData);
        return () => unsubscribe();
    }, []);

    const onSubmit = async (data: TriageForm) => {
        // 1. Create Patient (Simplified for Quick Admit)
        const patient = await saveMedicalRecord({
            name: data.name,
            nik: `EMER-${Date.now()}`, // Temporary ID
            gender: data.gender === 'male' ? 'Laki-laki' : 'Perempuan',
            birthDate: new Date(new Date().getFullYear() - parseInt(data.age)).toISOString().split('T')[0], // Approx DOB
            phone: '-',
            address: { line: '-', city: '-', district: '-', village: '-' },
            isSynced: false,
            timestamp: new Date().toISOString()
        } as unknown as PatientRecord); // Casting as we are using helper that expects specific omit but simplified

        // 2. Create Encounter
        const status = data.triageLevel === 'resus' ? 'in-progress' : 'triaged';

        await saveEncounter({
            patientId: patient.id,
            patientName: patient.name,
            class: 'EMER',
            status: status,
            soap: { s: data.complaint, o: `Triage: ${data.triageLevel.toUpperCase()}`, a: '', p: '' },
            prescriptions: [],
            isSynced: false,
            timestamp: new Date().toISOString()
        } as unknown as EncounterRecord);

        reset();
        setShowModal(false);
    };

    const getTriageColor = (level: string) => {
        if (level.includes('RESUS')) return 'bg-red-100 text-red-800 border-red-200';
        if (level.includes('URGENT')) return 'bg-amber-100 text-amber-800 border-amber-200';
        return 'bg-green-100 text-green-800 border-green-200';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Ambulance className="w-8 h-8 text-red-600" />
                        Instalasi Gawat Darurat (IGD)
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Real-time Triage Dashboard</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all active:scale-95"
                >
                    <UserPlus className="w-5 h-5" />
                    Quick Admit (Triage)
                </button>
            </div>

            {/* Triage Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                {/* Red Zone - Resuscitation */}
                <div className="bg-red-50 rounded-2xl border border-red-100 flex flex-col">
                    <div className="p-4 border-b border-red-100 bg-red-100/50 rounded-t-2xl flex justify-between items-center">
                        <h2 className="font-bold text-red-900 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Resuscitation (P1)
                        </h2>
                        <span className="bg-white text-red-700 font-bold px-2 py-0.5 rounded text-xs border border-red-200">
                            {patients.filter(p => p.soap.o.includes('RESUS')).length}
                        </span>
                    </div>
                    <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                        {patients.filter(p => p.soap.o.includes('RESUS')).map(patient => (
                            <div key={patient.id} className="bg-white p-4 rounded-xl border border-red-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900">{patient.patientName}</h3>
                                    <Clock className="w-4 h-4 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{patient.soap.s}</p>
                                <div className="mt-3 flex gap-2">
                                    <button className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors">
                                        Action
                                    </button>
                                    <button className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50">
                                        Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Yellow Zone - Emergent */}
                <div className="bg-amber-50 rounded-2xl border border-amber-100 flex flex-col">
                    <div className="p-4 border-b border-amber-100 bg-amber-100/50 rounded-t-2xl flex justify-between items-center">
                        <h2 className="font-bold text-amber-900 flex items-center gap-2">
                            <Activity className="w-5 h-5" /> Emergent (P2)
                        </h2>
                        <span className="bg-white text-amber-700 font-bold px-2 py-0.5 rounded text-xs border border-amber-200">
                            {patients.filter(p => p.soap.o.includes('URGENT')).length}
                        </span>
                    </div>
                    <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                        {patients.filter(p => p.soap.o.includes('URGENT')).map(patient => (
                            <div key={patient.id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900">{patient.patientName}</h3>
                                    <span className="text-xs text-amber-600 font-mono bg-amber-50 px-1.5 py-0.5 rounded">10m</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{patient.soap.s}</p>
                                <div className="mt-3 flex gap-2">
                                    <button className="flex-1 px-3 py-1.5 bg-white border border-amber-200 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-50 transition-colors">
                                        Assesment
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Green Zone - Non Urgent */}
                <div className="bg-green-50 rounded-2xl border border-green-100 flex flex-col">
                    <div className="p-4 border-b border-green-100 bg-green-100/50 rounded-t-2xl flex justify-between items-center">
                        <h2 className="font-bold text-green-900 flex items-center gap-2">
                            <Bed className="w-5 h-5" /> Non-Urgent (P3)
                        </h2>
                        <span className="bg-white text-green-700 font-bold px-2 py-0.5 rounded text-xs border border-green-200">
                            {patients.filter(p => !p.soap.o.includes('RESUS') && !p.soap.o.includes('URGENT')).length}
                        </span>
                    </div>
                    <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                        {patients.filter(p => !p.soap.o.includes('RESUS') && !p.soap.o.includes('URGENT')).map(patient => (
                            <div key={patient.id} className="bg-white p-4 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900">{patient.patientName}</h3>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{patient.soap.s}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Admit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Quick Triage Admission</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input {...register('name', { required: true })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="Patient Name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Age (Approx)</label>
                                    <input {...register('age', { required: true })} type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="e.g 45" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <select {...register('gender')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500">
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
                                <textarea {...register('complaint', { required: true })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" placeholder="Describe symptoms..."></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Triage Level</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <label className="cursor-pointer">
                                        <input type="radio" {...register('triageLevel', { required: true })} value="resus" className="peer sr-only" />
                                        <div className="text-center p-2 rounded-lg border border-gray-200 peer-checked:bg-red-100 peer-checked:border-red-500 peer-checked:text-red-700 font-semibold text-sm transition-all hover:bg-gray-50">
                                            RESUS (Red)
                                        </div>
                                    </label>
                                    <label className="cursor-pointer">
                                        <input type="radio" {...register('triageLevel', { required: true })} value="urgent" className="peer sr-only" />
                                        <div className="text-center p-2 rounded-lg border border-gray-200 peer-checked:bg-amber-100 peer-checked:border-amber-500 peer-checked:text-amber-700 font-semibold text-sm transition-all hover:bg-gray-50">
                                            URGENT (Yel)
                                        </div>
                                    </label>
                                    <label className="cursor-pointer">
                                        <input type="radio" {...register('triageLevel', { required: true })} value="non-urgent" className="peer sr-only" />
                                        <div className="text-center p-2 rounded-lg border border-gray-200 peer-checked:bg-green-100 peer-checked:border-green-500 peer-checked:text-green-700 font-semibold text-sm transition-all hover:bg-gray-50">
                                            FALSE (Grn)
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all mt-4">
                                Admit Patient
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
