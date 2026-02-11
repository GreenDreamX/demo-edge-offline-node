'use client';

import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import {
    getDecryptedRecords,
    subscribeToStatus,
    EncounterRecord,
    Invoice,
    Bed,
    GenericResource,
    FHIRMedicationRequest
} from '@/lib/storage';
import {
    Activity,
    DollarSign,
    Users,
    BedDouble, // Changed from Bed to BedDouble to avoid conflict with interface
    FileText,
    Printer,
    Download,
    TrendingUp
} from 'lucide-react';

export default function ExecutivePage() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'report'>('dashboard');
    const [stats, setStats] = useState({
        bor: 0,
        revenue: 0,
        totalPatients: 0,
        totalEncounters: 0
    });
    const [topDiseases, setTopDiseases] = useState<{ name: string, count: number }[]>([]);
    const [topDrugs, setTopDrugs] = useState<{ name: string, count: number }[]>([]);
    const [census, setCensus] = useState<EncounterRecord[]>([]);

    useEffect(() => {
        const fetchData = () => {
            const encounters = getDecryptedRecords('encounter') as EncounterRecord[];
            const beds = getDecryptedRecords('bed') as Bed[];
            const invoices = getDecryptedRecords('invoice') as Invoice[];
            const medications = getDecryptedRecords('medication') as GenericResource<FHIRMedicationRequest>[];
            const patients = getDecryptedRecords('patient');

            // 1. Calculate BOR (Bed Occupancy Rate)
            const totalBeds = beds.length;
            const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
            const bor = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

            // 2. Calculate Revenue (Paid Invoices)
            // Filter for simple demo: all time or current month. Let's do all time paid for now to ensure data shows.
            const revenue = invoices
                .filter(i => i.status === 'paid')
                .reduce((acc, curr) => acc + curr.total, 0);

            // 3. Top Diseases (from Encounter SOAP A)
            const diseaseMap: Record<string, number> = {};
            encounters.forEach(e => {
                const diagnosis = e.soap?.a;
                if (diagnosis) {
                    diseaseMap[diagnosis] = (diseaseMap[diagnosis] || 0) + 1;
                }
            });
            const sortedDiseases = Object.entries(diseaseMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5); // Start with top 5

            // 4. Top Drugs
            const drugMap: Record<string, number> = {};
            medications.forEach(m => {
                const drugName = m.data.medicationCodeableConcept.text;
                if (drugName) {
                    drugMap[drugName] = (drugMap[drugName] || 0) + 1;
                }
            });
            const sortedDrugs = Object.entries(drugMap)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // 5. Daily Census (Active Inpatients)
            // Logic: Class = IMP and Status = in-progress (or arrived/triaged if not yet discharged)
            const activeInpatients = encounters.filter(e =>
                e.class === 'IMP' &&
                ['arrived', 'triaged', 'in-progress'].includes(e.status)
            );

            setStats({
                bor,
                revenue,
                totalPatients: patients.length,
                totalEncounters: encounters.length
            });
            setTopDiseases(sortedDiseases);
            setTopDrugs(sortedDrugs);
            setCensus(activeInpatients);
        };

        fetchData();
        const unsubscribe = subscribeToStatus(fetchData);
        return () => unsubscribe();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center print:hidden">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="w-8 h-8 text-blue-600" />
                    Executive Information System
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'report' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        Laporan Harian
                    </button>
                </div>
            </div>

            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <BedDouble className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">BOR (Bed Occupancy)</p>
                                <h3 className="text-2xl font-bold text-gray-900">{stats.bor.toFixed(1)}%</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-xl">
                                <DollarSign className="w-8 h-8 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    Rp {stats.revenue.toLocaleString('id-ID')}
                                </h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-xl">
                                <Users className="w-8 h-8 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Active Patients</p>
                                <h3 className="text-2xl font-bold text-gray-900">{stats.totalPatients}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-3 bg-orange-50 rounded-xl">
                                <TrendingUp className="w-8 h-8 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Encounters</p>
                                <h3 className="text-2xl font-bold text-gray-900">{stats.totalEncounters}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Top Diseases */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-red-500" />
                                Top 10 Diagnoses (ICD-10)
                            </h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topDiseases} layout="vertical" margin={{ left: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: '#f3f4f6' }}
                                        />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                                            {topDiseases.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Drugs */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-500" />
                                Top 10 Prescribed Medications
                            </h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topDrugs} layout="vertical" margin={{ left: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ fill: '#f3f4f6' }}
                                        />
                                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20}>
                                            {topDrugs.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'report' && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 print:shadow-none print:border-none">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Sensus Harian Rawat Inap</h1>
                            <p className="text-gray-500">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors print:hidden"
                        >
                            <Printer className="w-4 h-4" /> Cetak Laporan
                        </button>
                    </div>

                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-900">
                                <th className="py-3 font-bold uppercase tracking-wider">No. MR</th>
                                <th className="py-3 font-bold uppercase tracking-wider">Nama Pasien</th>
                                <th className="py-3 font-bold uppercase tracking-wider">Tgl Masuk</th>
                                <th className="py-3 font-bold uppercase tracking-wider">Tgl Keluar</th>
                                <th className="py-3 font-bold uppercase tracking-wider">Diagnosa (Awal)</th>
                                <th className="py-3 font-bold uppercase tracking-wider">DPJP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {census.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500 italic">
                                        Tidak ada pasien rawat inap aktif saat ini.
                                    </td>
                                </tr>
                            ) : (
                                census.map((enc) => (
                                    <tr key={enc.id}>
                                        <td className="py-3 font-mono">{enc.patientId}</td>
                                        <td className="py-3 font-bold">{enc.patientName}</td>
                                        <td className="py-3">{new Date(enc.timestamp).toLocaleDateString()}</td>
                                        <td className="py-3">-</td>
                                        <td className="py-3">{enc.soap?.a || '-'}</td>
                                        <td className="py-3">dr. Spesialis</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="mt-12 flex justify-end print:mt-24">
                        <div className="text-center w-64">
                            <p className="mb-16">Mengetahui,</p>
                            <p className="font-bold border-b border-gray-900 pb-1">Kepala Ruangan</p>
                            <p className="text-xs text-gray-500 mt-1">NIP. .......................</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
