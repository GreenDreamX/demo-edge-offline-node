'use client';

import React, { useState, useEffect } from 'react';
import {
    getDecryptedRecords,
    subscribeToStatus,
    updateResourceStatus,
    saveDiagnosticReport,
    GenericResource,
    FHIRServiceRequest
} from '@/lib/storage';
import {
    Radio, // Icon for Rad
    Search,
    Clock,
    CheckCircle,
    FileText,
    ArrowRight,
    Save,
    Scan
} from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';

const RAD_CODES = ['Thorax PA', 'USG Abdomen', 'EKG', 'USG Kandungan', 'Rontgen Extremitas'];

export default function RadiologiPage() {
    const [requests, setRequests] = useState<GenericResource<FHIRServiceRequest>[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<GenericResource<FHIRServiceRequest> | null>(null);
    const [resultValue, setResultValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = () => {
            setLoading(true);
            const allRequests = getDecryptedRecords('service_request') as GenericResource<FHIRServiceRequest>[];
            const radRequests = allRequests.filter(r =>
                r.data.status === 'active' &&
                RAD_CODES.includes(r.data.code.text)
            );
            setRequests(radRequests);
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
                result: [{ display: resultValue, reference: '' }]
            });

            // 2. Update ServiceRequest status to completed
            await updateResourceStatus(selectedRequest.id, 'ServiceRequest', { status: 'completed' });

            toast.success("Ekspertise Radiologi Tersimpan!");
            setSelectedRequest(null);
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
                <div className="p-4 border-b border-gray-200 bg-gray-900">
                    <h2 className="font-bold text-white mb-3 flex items-center gap-2">
                        <Radio className="w-5 h-5 text-green-400" />
                        Worklist Radiologi
                    </h2>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari Pasien..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-800 border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500/50 outline-none placeholder-gray-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {[1, 2].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>)}
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="h-full flex items-center justify-center p-4">
                            <EmptyState icon={Scan} title="Tidak Ada Order" description="Belum ada permintaan radiologi." />
                        </div>
                    ) : (
                        filteredRequests.map(req => (
                            <div
                                key={req.id}
                                onClick={() => handleProcess(req)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedRequest?.id === req.id
                                    ? 'bg-green-50 border-green-200 ring-1 ring-green-300'
                                    : 'bg-white border-gray-100 hover:border-gray-300'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-gray-900 text-sm">Patient {req.data.subject?.reference.split('/')[1]?.slice(0, 8)}</span>
                                    <span className="text-xs font-mono text-gray-400">{new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                                        {req.data.code.text}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* Main Content: Result Entry */}
            <main className="flex-1 bg-gray-100 p-6 flex flex-col items-center justify-center">
                {selectedRequest ? (
                    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 bg-gray-900 text-white flex justify-between items-center">
                            <div>
                                <h1 className="text-xl font-bold flex items-center gap-2">
                                    <Scan className="w-6 h-6 text-green-400" />
                                    Input Ekspertise
                                </h1>
                                <p className="text-gray-400 text-sm mt-1">
                                    Order ID: <span className="font-mono text-gray-300">{selectedRequest.id.slice(0, 8)}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="bg-green-500/20 text-green-400 border border-green-500/50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {selectedRequest.data.code.text}
                                </span>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 h-[500px]">
                            {/* Simulated Image Viewer */}
                            <div className="md:col-span-2 bg-black flex flex-col items-center justify-center relative group">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 to-black opacity-50"></div>
                                <Scan className="w-24 h-24 text-gray-700 animate-pulse relative z-10" />
                                <p className="text-gray-600 mt-4 relative z-10 font-mono text-xs uppercase tracking-widest">DICOM Viewer Placeholder</p>
                                <div className="absolute top-4 left-4 text-white/50 text-xs font-mono">
                                    {new Date().toLocaleDateString()}
                                    <br />
                                    {selectedRequest.data.code.text}
                                </div>
                            </div>

                            {/* Report Input */}
                            <div className="p-6 flex flex-col border-l border-gray-200">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Expertise / Kesimpulan</label>
                                <textarea
                                    className="flex-1 w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500/20 outline-none text-sm resize-none font-sans"
                                    placeholder="Tulis hasil bacaan..."
                                    value={resultValue}
                                    onChange={e => setResultValue(e.target.value)}
                                />
                                <button
                                    onClick={handleSaveResult}
                                    disabled={!resultValue}
                                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-400">
                        <Radio className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                        <h2 className="text-xl font-bold text-gray-400">Pilih Order Radiologi</h2>
                        <p className="text-sm">Pilih pemeriksaan untuk memulai bacaan.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
