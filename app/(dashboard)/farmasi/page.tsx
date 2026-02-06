"use client";

import React, { useState, useEffect } from 'react';
import { Pill, CheckCircle, Clock, Search, ArrowRight, Package } from 'lucide-react';
import { getPrescriptions, subscribeToStatus, updateMedicationStatus, GenericResource, FHIRMedicationRequest } from '@/lib/storage';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

export default function FarmasiPage() {
    const [medications, setMedications] = useState<GenericResource<FHIRMedicationRequest>[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = () => {
            setLoading(true);
            const activeMeds = getPrescriptions('active');
            const completedMeds = getPrescriptions('completed');
            setMedications([...activeMeds, ...completedMeds]);
            setLoading(false);
        };

        fetchData();
        const unsubscribe = subscribeToStatus(fetchData);
        return () => unsubscribe();
    }, []);

    const processMedication = (id: string, name: string) => {
        if (confirm(`Konfirmasi selesai racik untuk ${name}?`)) {
            try {
                updateMedicationStatus(id, 'completed');
                toast.success("Resep berhasil diselesaikan!");
            } catch (error) {
                console.error(error);
                toast.error("Gagal memperbarui status resep.");
            }
        }
    };

    const incoming = medications.filter(m =>
        m.data.status === 'active' &&
        m.data.subject.display?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const completed = medications.filter(m =>
        m.data.status === 'completed' &&
        m.data.subject.display?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Pill className="w-8 h-8 text-purple-600" />
                        Instalasi Farmasi
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Prescription Fulfillment Queue</p>
                </div>
                <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                        type="text"
                        placeholder="Search Patient..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
                {/* Incoming Queue */}
                <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-purple-50 border-b border-purple-100 flex justify-between items-center">
                        <h2 className="font-bold text-purple-900 flex items-center gap-2">
                            <Clock className="w-5 h-5" /> Incoming / Pending
                        </h2>
                        <span className="bg-white text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-purple-200">
                            {incoming.length}
                        </span>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-gray-50/30">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => <div key={i} className="h-40 bg-white rounded-xl animate-pulse"></div>)}
                            </div>
                        ) : incoming.length === 0 ? (
                            <EmptyState
                                title="Antrean Kosong"
                                description="Tidak ada resep masuk saat ini."
                                icon={Package}
                            />
                        ) : (
                            incoming.map((item) => (
                                <div key={item.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{item.data.subject.display}</h3>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {item.id.slice(0, 8)}</p>
                                        </div>
                                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-medium">
                                            Active
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                                            <Pill className="w-5 h-5 text-purple-600 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-gray-900">{item.data.medicationCodeableConcept.text}</p>
                                                <p className="text-sm text-gray-600">{item.data.dosageInstruction[0].text}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => processMedication(item.id, item.data.subject.display || '')}
                                        className="w-full py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        Process & Dispense <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )))}
                    </div>
                </div>

                {/* Finished Queue */}
                <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                    <div className="p-4 bg-green-50 border-b border-green-100 flex justify-between items-center">
                        <h2 className="font-bold text-green-900 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" /> Dispensed / Finished
                        </h2>
                        <span className="bg-white text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-green-200">
                            {completed.length}
                        </span>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-gray-50/30">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => <div key={i} className="h-24 bg-white rounded-xl animate-pulse"></div>)}
                            </div>
                        ) : (
                            completed.map((item) => (
                                <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm opacity-75 hover:opacity-100 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{item.data.subject.display}</h3>
                                            <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                                        </div>
                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-medium flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Completed
                                        </span>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600 pl-2 border-l-2 border-green-200">
                                        {item.data.medicationCodeableConcept.text} - {item.data.dosageInstruction[0].text}
                                    </div>
                                </div>
                            )))}
                    </div>
                </div>
            </div>
        </div>
    );
}
