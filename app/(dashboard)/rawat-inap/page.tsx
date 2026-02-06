"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Bed, User, FileText, CheckCircle, Activity, Plus } from 'lucide-react';
import { getDecryptedRecords, subscribeToStatus, saveClinicalImpression, EncounterRecord, FHIRClinicalImpression } from '@/lib/storage'; // Adjusted import path

interface CPPTForm {
    s: string;
    o: string;
    a: string; // Assessment
    p: string; // Plan
}

export default function RawatInapPage() {
    const [occupiedBeds, setOccupiedBeds] = useState<{ [key: string]: EncounterRecord }>({});
    const [selectedBed, setSelectedBed] = useState<string | null>(null);
    const [showCPPTModal, setShowCPPTModal] = useState(false);

    // Mock Bed Configuration
    const beds = Array.from({ length: 12 }, (_, i) => ({
        id: `A-${i + 1}`,
        label: `Bed A-${i + 1}`
    }));

    const { register, handleSubmit, reset } = useForm<CPPTForm>();

    useEffect(() => {
        const fetchData = () => {
            const allEncounters = getDecryptedRecords('encounter') as EncounterRecord[];
            // Filter: Class=IMP (Inpatient) AND Status=in-progress
            const inpatientEncounters = allEncounters.filter(e =>
                e.class === 'IMP' && e.status === 'in-progress'
            );

            // Map to beds (Simulated assignment for demo: 1st patient -> Bed A-1, etc.)
            // In a real app, Encounter would have a Location resource or extension for Bed ID.
            const bedMap: { [key: string]: EncounterRecord } = {};
            inpatientEncounters.forEach((enc, index) => {
                if (index < beds.length) {
                    bedMap[beds[index].id] = enc;
                }
            });
            setOccupiedBeds(bedMap);
        };

        fetchData();
        const unsubscribe = subscribeToStatus(fetchData);
        return () => unsubscribe();
    }, []);

    const handleBedClick = (bedId: string) => {
        if (occupiedBeds[bedId]) {
            setSelectedBed(bedId);
            setShowCPPTModal(true);
        }
    };

    const onSubmitCPPT = async (data: CPPTForm) => {
        if (!selectedBed || !occupiedBeds[selectedBed]) return;

        const encounter = occupiedBeds[selectedBed];
        const summary = `S: ${data.s}\nO: ${data.o}\nA: ${data.a}\nP: ${data.p}`;

        await saveClinicalImpression({
            resourceType: "ClinicalImpression",
            status: "completed",
            subject: { reference: `Patient/${encounter.patientId}`, display: encounter.patientName },
            encounter: { reference: `Encounter/${encounter.id}` },
            effectiveDateTime: new Date().toISOString(),
            summary: summary,
            assessor: { display: "Dr. Yudhistira" } // Mock logged in user
        });

        alert("CPPT Saved Successfully!");
        reset();
        setShowCPPTModal(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Bed className="w-8 h-8 text-blue-600" />
                    Rawat Inap (Inpatient Ward)
                </h1>
                <p className="text-gray-500 font-medium mt-1">Bed Management & Daily Monitoring</p>
            </div>

            {/* Bed Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {beds.map((bed) => {
                    const isOccupied = !!occupiedBeds[bed.id];
                    const patient = occupiedBeds[bed.id];

                    return (
                        <div
                            key={bed.id}
                            onClick={() => handleBedClick(bed.id)}
                            className={`
                                relative p-6 rounded-2xl border-2 transition-all cursor-pointer group hover:scale-[1.02]
                                ${isOccupied
                                    ? 'bg-red-50 border-red-200 hover:border-red-300'
                                    : 'bg-green-50 border-green-200 hover:border-green-300 border-dashed'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`font-bold text-lg ${isOccupied ? 'text-red-700' : 'text-green-700'}`}>
                                    {bed.label}
                                </span>
                                {isOccupied ? (
                                    <User className="w-6 h-6 text-red-500" />
                                ) : (
                                    <CheckCircle className="w-6 h-6 text-green-500 opacity-50" />
                                )}
                            </div>

                            {isOccupied ? (
                                <div>
                                    <p className="font-bold text-gray-900 text-lg truncate">{patient.patientName}</p>
                                    <div className="flex items-center gap-2 text-sm text-red-600 mt-1">
                                        <Activity className="w-4 h-4" />
                                        <span>In Progress</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-4">Click to add CPPT</p>
                                </div>
                            ) : (
                                <div className="h-16 flex items-center justify-center text-green-600/50 font-medium">
                                    Empty Bed
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* CPPT Modal */}
            {showCPPTModal && selectedBed && occupiedBeds[selectedBed] && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Catatan Perkembangan Pasien (CPPT)</h3>
                                <p className="text-sm text-gray-500">Patient: {occupiedBeds[selectedBed].patientName}</p>
                            </div>
                            <button onClick={() => setShowCPPTModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmitCPPT)} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subjective (S)</label>
                                    <textarea {...register('s', { required: true })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Patient complaints..."></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Objective (O)</label>
                                    <textarea {...register('o', { required: true })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Physical exam findings..."></textarea>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assessment (A)</label>
                                <textarea {...register('a', { required: true })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Diagnosis / Analysis..."></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Plan (P)</label>
                                <textarea {...register('p', { required: true })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Treatment plan..."></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowCPPTModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700">Save CPPT Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
