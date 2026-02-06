"use client";

import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, User, Activity, Pill, Stethoscope, ArrowDown } from 'lucide-react';
import { getDecryptedRecords, subscribeToStatus, PatientRecord, EncounterRecord, GenericResource, FHIRMedicationRequest, FHIRClinicalImpression } from '@/lib/storage';
import { EmptyState } from '@/components/ui/EmptyState';

export default function RekamMedisPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
    const [timeline, setTimeline] = useState<any[]>([]);

    // Data States
    const [patients, setPatients] = useState<PatientRecord[]>([]);
    const [encounters, setEncounters] = useState<EncounterRecord[]>([]);
    const [medications, setMedications] = useState<GenericResource<FHIRMedicationRequest>[]>([]);
    const [impressions, setImpressions] = useState<GenericResource<FHIRClinicalImpression>[]>([]);

    useEffect(() => {
        const fetchData = () => {
            setPatients(getDecryptedRecords('patient') as PatientRecord[]);
            setEncounters(getDecryptedRecords('encounter') as EncounterRecord[]);
            setMedications(getDecryptedRecords('medication') as GenericResource<FHIRMedicationRequest>[]);
            setImpressions(getDecryptedRecords('clinical_impression') as GenericResource<FHIRClinicalImpression>[]);
        };

        fetchData();
        const unsubscribe = subscribeToStatus(fetchData);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (selectedPatient) {
            // Build Timeline
            const patientEncounters = encounters.filter(e => e.patientId === selectedPatient.id).map(e => ({
                type: 'encounter',
                date: e.timestamp,
                data: e
            }));

            const patientMeds = medications.filter(m => m.data.subject.reference.includes(selectedPatient.id)).map(m => ({
                type: 'medication',
                date: m.timestamp,
                data: m
            }));

            const patientImpressions = impressions.filter(i => i.data.subject.reference.includes(selectedPatient.id)).map(i => ({
                type: 'cp',
                date: i.timestamp,
                data: i
            }));

            const combined = [...patientEncounters, ...patientMeds, ...patientImpressions].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setTimeline(combined);
        } else {
            setTimeline([]);
        }
    }, [selectedPatient, encounters, medications, impressions]);

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nik.includes(searchTerm)
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-[calc(100vh-100px)] flex flex-col">
            <div className="flex-none">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-8 h-8 text-blue-600" />
                    Rekam Medis Elektronik (RME)
                </h1>
                <p className="text-gray-500 font-medium mt-1">Patient History & Timeline</p>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Search Sidebar */}
                <div className="w-1/3 bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <div className="relative">
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                placeholder="Search by Name or NIK..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {filteredPatients.length === 0 ? (
                            <div className="mt-10">
                                <EmptyState title="Tidak Ditemukan" description="Coba kata kunci lain." icon={Search} />
                            </div>
                        ) : (
                            filteredPatients.map(patient => (
                                <div
                                    key={patient.id}
                                    onClick={() => setSelectedPatient(patient)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedPatient?.id === patient.id
                                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                        : 'bg-white border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold">
                                            {patient.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{patient.name}</p>
                                            <p className="text-xs text-gray-500 font-mono">NIK: {patient.nik}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Timeline Area */}
                <div className="flex-1 bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden relative">
                    {!selectedPatient ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <Search className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Select a patient to view history</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Patient Header */}
                            <div className="p-6 border-b border-gray-100 bg-blue-50/50 flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedPatient.name}</h2>
                                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                                        <span className="flex items-center gap-1"><User className="w-4 h-4" /> {selectedPatient.gender}</span>
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {selectedPatient.birthDate}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">ACTIVE</span>
                                </div>
                            </div>

                            {/* Timeline Content */}
                            <div className="flex-1 overflow-y-auto p-8 relative">
                                <div className="absolute left-10 top-0 bottom-0 w-0.5 bg-gray-200 z-0"></div>

                                {timeline.length === 0 && (
                                    <p className="text-center text-gray-400 mt-10">No medical history found.</p>
                                )}

                                {timeline.map((item, idx) => (
                                    <div key={idx} className="relative z-10 mb-8 pl-12 group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                        {/* Icon Node */}
                                        <div className={`absolute left-0 w-20 flex justify-center`}>
                                            <div className={`w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 
                                                ${item.type === 'encounter' ? 'bg-blue-100 text-blue-600' :
                                                    item.type === 'medication' ? 'bg-purple-100 text-purple-600' :
                                                        'bg-green-100 text-green-600'}`}>
                                                {item.type === 'encounter' && <Stethoscope className="w-5 h-5" />}
                                                {item.type === 'medication' && <Pill className="w-5 h-5" />}
                                                {item.type === 'cp' && <Activity className="w-5 h-5" />}
                                            </div>
                                        </div>

                                        {/* Content Card */}
                                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide
                                                    ${item.type === 'encounter' ? 'bg-blue-50 text-blue-700' :
                                                        item.type === 'medication' ? 'bg-purple-50 text-purple-700' :
                                                            'bg-green-50 text-green-700'}`}>
                                                    {item.type === 'encounter' ? 'Consultation' :
                                                        item.type === 'medication' ? 'Prescription' : 'CPPT Note'}
                                                </span>
                                                <span className="text-xs text-gray-400">{new Date(item.date).toLocaleString()}</span>
                                            </div>

                                            {item.type === 'encounter' && (
                                                <div>
                                                    <p className="font-bold text-gray-900">{item.data.class} - {item.data.status}</p>
                                                    <p className="text-sm text-gray-600 mt-1 italic">"{item.data.soap.s}"</p>
                                                    {item.data.soap.a && (
                                                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700 border border-gray-100">
                                                            <strong>Diagnosis:</strong> {item.data.soap.a}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {item.type === 'medication' && (
                                                <div>
                                                    <p className="font-bold text-gray-900">{item.data.data.medicationCodeableConcept.text}</p>
                                                    <p className="text-sm text-gray-600">{item.data.data.dosageInstruction[0].text}</p>
                                                    <div className="mt-2 text-xs">
                                                        Status: <span className="font-semibold">{item.data.data.status}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {item.type === 'cp' && (
                                                <div>
                                                    <p className="font-bold text-gray-900">Progress Note</p>
                                                    <pre className="text-sm font-sans text-gray-600 mt-2 whitespace-pre-wrap bg-gray-50 p-2 rounded border border-gray-100">{item.data.data.summary}</pre>
                                                    <p className="text-xs text-gray-400 mt-2 text-right">By {item.data.data.assessor?.display}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
