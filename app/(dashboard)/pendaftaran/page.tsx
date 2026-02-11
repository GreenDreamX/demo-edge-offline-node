'use client';

import React, { useState, useEffect } from 'react';
import {
    User,
    Calendar,
    CreditCard,
    Save,
    Search,
    MapPin,
    Phone,
    FileText,
    Users,
    ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
    saveMedicalRecord,
    getDecryptedRecords,
    subscribeToStatus, // Import subscriber
    PatientRecord
} from '@/lib/storage';

import { PageHeader } from '@/components/ui/PageHeader';

export default function PendaftaranPage() {
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        nik: '',
        gender: 'Laki-laki',
        birthDate: '',
        phone: '',
        address: {
            line: '',
            city: '',
            district: '',
            village: ''
        },
        paymentMethod: 'BPJS'
    });

    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState<PatientRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isHydrating, setIsHydrating] = useState(true); // Loading state for initial fetch

    // Fetch Data on Mount & Subscribe
    useEffect(() => {
        const loadData = () => {
            const data = getDecryptedRecords('patient') as PatientRecord[];
            setPatients(data);
            setIsHydrating(false);
        };

        // Initial Load
        loadData();

        // Subscribe to DB changes
        const unsubscribe = subscribeToStatus(loadData);
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Basic Validation
        if (!formData.name || !formData.nik || !formData.phone) {
            toast.error("Mohon lengkapi data wajib (Nama, NIK, HP)");
            setLoading(false);
            return;
        }

        try {
            await saveMedicalRecord({
                name: formData.name,
                nik: formData.nik,
                gender: formData.gender,
                birthDate: formData.birthDate,
                phone: formData.phone,
                address: formData.address
            });

            toast.success(`Pasien ${formData.name} berhasil didaftarkan!`);

            // Reset Form but keep somewhat sensible defaults
            setFormData({
                name: '',
                nik: '',
                gender: 'Laki-laki',
                birthDate: '',
                phone: '',
                address: { line: '', city: '', district: '', village: '' },
                paymentMethod: 'BPJS'
            });

        } catch (err) {
            console.error(err);
            toast.error("Gagal menyimpan data pasien.");
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nik.includes(searchQuery)
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
            <div className="w-full lg:w-1/3 flex flex-col gap-6">
                <PageHeader
                    title="Pendaftaran"
                    description="Registrasi pasien baru atau lama."
                />

                {/* Registration Form Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Formulir Pasien
                        </h2>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* NIK */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">NIK (KTP)</label>
                                <div className="relative">
                                    <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                                        placeholder="3201xxxxxxxxxxxx"
                                        value={formData.nik}
                                        onChange={e => setFormData({ ...formData, nik: e.target.value })}
                                        maxLength={16}
                                    />
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-semibold text-sm"
                                    placeholder="Nama sesuai KTP"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Gender */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Jenis Kelamin</label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm"
                                        value={formData.gender}
                                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="Laki-laki">Laki-laki</option>
                                        <option value="Perempuan">Perempuan</option>
                                    </select>
                                </div>
                                {/* Birth Date */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tanggal Lahir</label>
                                    <div className="relative">
                                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="date"
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm"
                                            value={formData.birthDate}
                                            onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">No. Handphone / WhatsApp</label>
                                <div className="relative">
                                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="tel"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm"
                                        placeholder="08xxxxxxxxxx"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Address Group */}
                            <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Alamat Domisili
                                </h3>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                    placeholder="Alamat Jalan / RT RW"
                                    value={formData.address.line}
                                    onChange={e => setFormData({ ...formData, address: { ...formData.address, line: e.target.value } })}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                        placeholder="Kelurahan"
                                        value={formData.address.village}
                                        onChange={e => setFormData({ ...formData, address: { ...formData.address, village: e.target.value } })}
                                    />
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                        placeholder="Kecamatan"
                                        value={formData.address.district}
                                        onChange={e => setFormData({ ...formData, address: { ...formData.address, district: e.target.value } })}
                                    />
                                </div>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                    placeholder="Kota / Kabupaten"
                                    value={formData.address.city}
                                    onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                />
                            </div>
                        </form>
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                        <button
                            type="submit"
                            onClick={handleSubmit} // Moved submit trigger here if form isn't wrapping everything
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />}
                            {loading ? 'Menyimpan...' : 'Simpan Data'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Patient List */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
                {/* Using PageHeader for consistency, maybe different description */}
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Database Pasien</h2>
                        <p className="text-sm text-gray-500">Pasien terdaftar hari ini: {patients.length}</p>
                    </div>
                    {/* Search Bar */}
                    <div className="relative w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            placeholder="Cari Nama / NIK..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
                    <div className="overflow-auto flex-1 p-4">
                        {isHydrating ? (
                            <TableSkeleton rows={6} />
                        ) : filteredPatients.length === 0 ? (
                            <EmptyState
                                title="Belum Ada Data"
                                description="Silakan daftarkan pasien baru."
                                icon={Users}
                            />
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {filteredPatients.map((patient) => (
                                    <div key={patient.id} className="group bg-white p-5 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {patient.name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-600 border border-gray-200">
                                                        {patient.queueNumber}
                                                    </span>
                                                    <span className="font-mono">{patient.nik}</span>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${patient.isSynced
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                {patient.isSynced ? 'Synced' : 'Local'}
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                {patient.birthDate}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="truncate">{patient.address.city}, {patient.address.village}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                                            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group/btn">
                                                Detail Pasien <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Ensure EmptyState and TableSkeleton handle undefined gracefullly if imported, 
// but assuming they exist as per standard shadcn/ui or custom components previously seen.
