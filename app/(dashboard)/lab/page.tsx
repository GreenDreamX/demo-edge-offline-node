'use client';

import React, { useState, useEffect } from 'react';
import {
    getDecryptedRecords,
    subscribeToStatus,
    updateResourceStatus,
    saveDiagnosticReport,
    GenericResource,
    FHIRServiceRequest,
    FHIRDiagnosticReport
} from '@/lib/storage';
import {
    Beaker,
    Search,
    Clock,
    CheckCircle,
    TestTube,
    FileText,
    ArrowRight,
    Save
} from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

const LAB_CODES = ['Darah Lengkap', 'Urine Rutin', 'Gula Darah Sewaktu', 'Kolesterol Total', 'Asam Urat', 'Fungsi Hati', 'Fungsi Ginjal'];

export default function LabPage() {
    const [requests, setRequests] = useState<GenericResource<FHIRServiceRequest>[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<GenericResource<FHIRServiceRequest> | null>(null);
    const [resultValue, setResultValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = () => {
            setLoading(true);
            const allRequests = getDecryptedRecords('service_request') as GenericResource<FHIRServiceRequest>[];
            const labRequests = allRequests.filter(r =>
                r.data.status === 'active' &&
                LAB_CODES.includes(r.data.code.text)
            );
            setRequests(labRequests);
            setLoading(false);
        };

        fetchData();
        const unsubscribe = subscribeToStatus(fetchData);
        return () => unsubscribe();
    }, []);

    const handleProcess = (req: GenericResource<FHIRServiceRequest>) => {
        setSelectedRequest(req);
        setResultValue('');
    };

    const handleSaveResult = async () => {
        if (!selectedRequest || !resultValue) return;

        try {
            // 1. Create DiagnosticReport
            await saveDiagnosticReport({
                resourceType: "DiagnosticReport",
                status: "final",
                code: { text: selectedRequest.data.code.text },
                subject: selectedRequest.data.subject,
                effectiveDateTime: new Date().toISOString(),
                result: [{ display: resultValue, reference: '' }] // Simplified result storage
            });

            // 2. Update ServiceRequest status to completed
            await updateResourceStatus(selectedRequest.id, 'ServiceRequest', { status: 'completed' });

            toast.success("Hasil Laboratorium Tersimpan!");
            setSelectedRequest(null);

            // Refresh logic handled by subscription, but optimistically update UI could be done here
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan hasil.");
        }
    };

    const filteredRequests = requests.filter(r =>
        r.data.subject?.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-6rem)] -m-6 overflow-hidden">
            {/* Sidebar: Worklist */}
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col z-10">
                <div className="p-4 border-b border-gray-200 bg-blue-50/50">
                    <h2 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <Beaker className="w-5 h-5" />
                        Worklist Lab
                    </h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari Pasien..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>)}
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="h-full flex items-center justify-center p-4">
                            <EmptyState icon={TestTube} title="Tidak Ada Order" description="Belum ada permintaan lab baru." />
                        </div>
                    ) : (
                        filteredRequests.map(req => (
                            <div
                                key={req.id}
                                onClick={() => handleProcess(req)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedRequest?.id === req.id
                                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300'
                                    : 'bg-white border-gray-100 hover:border-gray-300'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-gray-900 text-sm">Patient {req.data.subject?.reference.split('/')[1]?.slice(0, 8)}</span>
                                    <span className="text-xs font-mono text-gray-400">{new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                                        {req.data.code.text}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* Main Content: Result Entry */}
            <main className="flex-1 bg-gray-50 p-6 flex flex-col items-center justify-center">
                {selectedRequest ? (
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <TestTube className="w-6 h-6 text-blue-600" />
                                    Input Hasil Laboratorium
                                </h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    Order ID: <span className="font-mono">{selectedRequest.id.slice(0, 8)}</span> •
                                    Patient: <span className="font-semibold">{selectedRequest.data.subject?.reference}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {selectedRequest.data.code.text}
                                </span>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Hasil Pemeriksaan</label>
                                <textarea
                                    className="w-full h-40 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-lg resize-none font-mono"
                                    placeholder="Masukkan hasil lengkap (angka/deskripsi)..."
                                    value={resultValue}
                                    onChange={e => setResultValue(e.target.value)}
                                    autoFocus
                                />
                                <p className="text-xs text-gray-400 mt-2">Pastikan hasil sudah divalidasi sebelum disimpan.</p>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={handleSaveResult}
                                    disabled={!resultValue}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-5 h-5" />
                                    Simpan & Finalisasi
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-400">
                        <Beaker className="w-20 h-20 mx-auto mb-4 text-gray-200" />
                        <h2 className="text-xl font-bold text-gray-300">Pilih Order Lab</h2>
                        <p className="text-sm">Pilih permintaan dari daftar di sebelah kiri untuk memproses.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
