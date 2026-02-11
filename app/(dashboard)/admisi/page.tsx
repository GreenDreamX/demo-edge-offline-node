'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
    Bed,
    BedDouble,
    User,
    CheckCircle,
    XCircle,
    AlertCircle,
    Plus,
    Search,
    ArrowRight
} from 'lucide-react';
import {
    getDecryptedRecords,
    saveBed,
    updateBedStatus,
    saveEncounter,
    updateResourceStatus,
    subscribeToStatus,
    Bed as BedType,
    PatientRecord
} from '@/lib/storage';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { PageHeader } from '@/components/ui/PageHeader';

export default function AdmisiPage() {
    const [beds, setBeds] = useState<BedType[]>([]);
    const [patients, setPatients] = useState<PatientRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBed, setSelectedBed] = useState<BedType | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Data & Auto-Generate Beds if Empty
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            let currentBeds = getDecryptedRecords('bed') as BedType[];

            // DEMO: Auto-generate beds if none exist
            if (currentBeds.length === 0) {
                const classes = ['VVIP', 'VIP', '1', '2', '2', '3', '3', '3', 'Iso'];
                let promises = [];
                for (let i = 0; i < 20; i++) {
                    const cls = classes[i % classes.length] as BedType['class'];
                    promises.push(saveBed({
                        roomName: `R-${101 + i}`,
                        class: cls,
                        status: 'available'
                    }));
                }
                await Promise.all(promises);
                currentBeds = getDecryptedRecords('bed') as BedType[]; // Re-fetch
            }

            setBeds(currentBeds);

            // Fetch potential patients for admission (synced but not currently admitted?)
            // For demo, we just grab all patients
            setPatients(getDecryptedRecords('patient') as PatientRecord[]);

            setLoading(false);
        };

        fetchData();
        const unsubscribe = subscribeToStatus(fetchData);
        return () => unsubscribe();
    }, []);

    const handleAdmit = async (patient: PatientRecord) => {
        if (!selectedBed) return;

        try {
            // 1. Update Bed
            updateBedStatus(selectedBed.id, 'occupied', patient.id, patient.name);

            // 2. Create Encounter (Inpatient)
            await saveEncounter({
                patientId: patient.id,
                patientName: patient.name,
                class: 'IMP', // Inpatient
                status: 'in-progress',
                soap: { s: 'Admission', o: '-', a: 'TBD', p: 'Inpatient Care' },
                prescriptions: []
            });

            toast.success(`Pasien ${patient.name} berhasil masuk ${selectedBed.roomName}`);
            setShowModal(false);
            setSelectedBed(null);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memproses admisi.");
        }
    };

    const handleDischarge = (bed: BedType) => {
        if (confirm(`Pasien ${bed.patientName} akan pulang/keluar. Konfirmasi?`)) {
            updateBedStatus(bed.id, 'cleaning'); // Mark as cleaning first
            toast.success("Pasien checkout. Bed status: Cleaning.");
        }
    };

    const handleClean = (bed: BedType) => {
        updateBedStatus(bed.id, 'available');
        toast.success("Bed siap digunakan kembali.");
    };

    // Group Beds by Class
    const bedsByClass = beds.reduce((acc, bed) => {
        if (!acc[bed.class]) acc[bed.class] = [];
        acc[bed.class].push(bed);
        return acc;
    }, {} as Record<string, BedType[]>);

    const orderedClasses = ['VVIP', 'VIP', '1', '2', '3', 'Iso'];

    // ... 

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
            {/* Header */}
            <PageHeader
                title="Manajemen Bed Rawat Inap"
                description="Pantau ketersediaan kamar dan admisi pasien."
                action={
                    <div className="flex gap-4">
                        <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                            <span className="font-semibold text-slate-700 text-sm">Available: {beds.filter(b => b.status === 'available').length}</span>
                        </div>
                        <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                            <span className="font-semibold text-slate-700 text-sm">Occupied: {beds.filter(b => b.status === 'occupied').length}</span>
                        </div>
                    </div>
                }
            />

            {loading ? <TableSkeleton /> : (
                <div className="space-y-8">
                    {orderedClasses.map((cls) => (
                        bedsByClass[cls] && (
                            <div key={cls} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-slate-800">Kelas {cls}</h2>
                                    <span className="text-sm font-medium text-slate-500">{bedsByClass[cls].length} Bed(s)</span>
                                </div>
                                <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {bedsByClass[cls].map(bed => (
                                        <div
                                            key={bed.id}
                                            onClick={() => {
                                                if (bed.status === 'available') {
                                                    setSelectedBed(bed);
                                                    setShowModal(true);
                                                } else if (bed.status === 'occupied') {
                                                    handleDischarge(bed);
                                                } else if (bed.status === 'cleaning') {
                                                    handleClean(bed);
                                                }
                                            }}
                                            className={`
                                                relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md
                                                flex flex-col items-center justify-center text-center gap-2 aspect-square
                                                ${bed.status === 'available' ? 'border-green-100 bg-green-50 hover:border-green-300' : ''}
                                                ${bed.status === 'occupied' ? 'border-red-100 bg-red-50 hover:border-red-300' : ''}
                                                ${bed.status === 'cleaning' ? 'border-yellow-100 bg-yellow-50 hover:border-yellow-300' : ''}
                                            `}
                                        >
                                            <div className={`p-2 rounded-full 
                                                ${bed.status === 'available' ? 'bg-green-100 text-green-600' : ''}
                                                ${bed.status === 'occupied' ? 'bg-red-100 text-red-600' : ''}
                                                ${bed.status === 'cleaning' ? 'bg-yellow-100 text-yellow-600' : ''}
                                            `}>
                                                <Bed className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-900 block">{bed.roomName}</span>
                                                <span className="text-xs uppercase font-bold tracking-wider 
                                                    ${bed.status === 'available' ? 'text-green-600' : ''}
                                                    ${bed.status === 'occupied' ? 'text-red-600' : ''}
                                                    ${bed.status === 'cleaning' ? 'text-yellow-600' : ''}
                                                ">
                                                    {bed.status}
                                                </span>
                                            </div>
                                            {bed.patientName && (
                                                <div className="absolute top-2 right-2 left-2 bg-white/80 backdrop-blur rounded px-2 py-1 text-xs truncate font-medium text-slate-700 shadow-sm">
                                                    {bed.patientName}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}
                </div>
            )}

            {/* Admission Modal */}
            {showModal && selectedBed && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">Admisi Pasien ke {selectedBed.roomName}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-4 relative">
                                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama pasien..."
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(patient => (
                                    <div
                                        key={patient.id}
                                        onClick={() => handleAdmit(patient)}
                                        className="flex justify-between items-center p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-blue-100 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                {patient.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{patient.name}</p>
                                                <p className="text-xs text-gray-500">{patient.nik}</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
