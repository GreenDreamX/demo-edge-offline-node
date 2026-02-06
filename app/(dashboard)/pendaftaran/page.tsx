"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, MapPin, Phone, Save, Loader2, ArrowRight } from 'lucide-react';
import { useWilayah } from '@/hooks/useWilayah';
import { toast } from 'sonner';


// Basic Schema for Validation
const RegistrationSchema = z.object({
    nik: z.string().min(16, "NIK harus 16 digit"),
    name: z.string().min(3, "Nama terlalu pendek"),
    birthDate: z.string().min(1, "Tanggal lahir wajib diisi"),
    gender: z.enum(["Laki-laki", "Perempuan"]),
    phone: z.string().min(10, "Nomor HP tidak valid"),
    email: z.string().email().optional().or(z.literal('')),
    provinceId: z.string().optional(),
    regencyId: z.string().optional(),
    districtId: z.string().optional(),
    villageId: z.string().optional(),
    addressLine: z.string().optional(),
    emergencyName: z.string().optional(),
    emergencyRelation: z.string().optional(),
    emergencyPhone: z.string().optional(),
});

type RegistrationForm = z.infer<typeof RegistrationSchema>;

import { saveMedicalRecord, saveEncounter, PatientRecord } from '@/lib/storage';

export default function PendaftaranPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { provinces, regencies, districts, villages, fetchRegencies, fetchDistricts, fetchVillages, loading: addressLoading } = useWilayah();

    const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<RegistrationForm>({
        resolver: zodResolver(RegistrationSchema)
    });

    const onSubmit = async (data: RegistrationForm) => {
        setIsSubmitting(true);
        try {
            // Find names for address IDs
            const provinceName = provinces.find(p => p.id === data.provinceId)?.name || '';
            const regencyName = regencies.find(r => r.id === data.regencyId)?.name || '';
            const districtName = districts.find(d => d.id === data.districtId)?.name || '';
            const villageName = villages.find(v => v.id === data.villageId)?.name || '';

            const patientData: Omit<PatientRecord, 'id' | 'timestamp' | 'isSynced' | 'queueNumber' | 'resourceType'> = {
                name: data.name,
                nik: data.nik,
                gender: data.gender,
                birthDate: data.birthDate,
                phone: data.phone,
                address: {
                    line: data.addressLine,
                    city: regencyName,
                    district: districtName,
                    village: villageName
                },
                // Add extended fields later if schema supports them, for now core fields
            };

            const newPatient = await saveMedicalRecord({
                ...patientData,
                resourceType: "Patient"
            } as PatientRecord);

            // AUTO-CREATE ENCOUNTER for Data Flow
            await saveEncounter({
                patientId: newPatient.id,
                patientName: newPatient.name,
                class: 'AMB',
                status: 'arrived',
                soap: { s: '', o: '', a: '', p: '' },
                prescriptions: [],
                paymentStatus: 'unpaid'
            });

            toast.success("Pasien berhasil didaftarkan & Masuk Antrean Poli!");
            reset();
        } catch (error) {
            console.error(error);
            toast.error("Gagal menyimpan data pasien. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-8 h-8 text-blue-600" />
                    Pendaftaran Pasien Baru
                </h1>
                <p className="text-gray-500 font-medium mt-1">Form Registrasi dengan Validasi Kependudukan</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                {/* Section 1: Identitas */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</div>
                        Identitas Kependudukan
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">NIK (Nomor Induk Kependudukan) <span className="text-red-500">*</span></label>
                            <input {...register('nik')} type="number" className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${errors.nik ? 'border-red-500' : 'border-gray-300'}`} placeholder="16 digit NIK" />
                            {errors.nik && <p className="text-red-500 text-xs mt-1">{errors.nik.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                            <input {...register('name')} className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${errors.name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Sesuai KTP" />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir <span className="text-red-500">*</span></label>
                            <input {...register('birthDate')} type="date" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
                            {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin <span className="text-red-500">*</span></label>
                            <div className="flex gap-4 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input {...register('gender')} type="radio" value="Laki-laki" className="w-4 h-4 text-blue-600" />
                                    <span>Laki-laki</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input {...register('gender')} type="radio" value="Perempuan" className="w-4 h-4 text-blue-600" />
                                    <span>Perempuan</span>
                                </label>
                            </div>
                            {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Section 2: Alamat Domisili */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</div>
                        Alamat Domisili (Integrasi Kemendagri)
                        {addressLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                            <select
                                {...register('provinceId')}
                                onChange={(e) => {
                                    register('provinceId').onChange(e);
                                    fetchRegencies(e.target.value);
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white"
                            >
                                <option value="">Pilih Provinsi</option>
                                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            {errors.provinceId && <p className="text-red-500 text-xs mt-1">{errors.provinceId.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kabupaten/Kota</label>
                            <select
                                {...register('regencyId')}
                                onChange={(e) => {
                                    register('regencyId').onChange(e);
                                    fetchDistricts(e.target.value);
                                }}
                                disabled={!watch('provinceId')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white disabled:bg-gray-50"
                            >
                                <option value="">Pilih Kota/Kab</option>
                                {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            {errors.regencyId && <p className="text-red-500 text-xs mt-1">{errors.regencyId.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan</label>
                            <select
                                {...register('districtId')}
                                onChange={(e) => {
                                    register('districtId').onChange(e);
                                    fetchVillages(e.target.value);
                                }}
                                disabled={!watch('regencyId')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white disabled:bg-gray-50"
                            >
                                <option value="">Pilih Kecamatan</option>
                                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            {errors.districtId && <p className="text-red-500 text-xs mt-1">{errors.districtId.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Desa/Kelurahan</label>
                            <select
                                {...register('villageId')}
                                disabled={!watch('districtId')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white disabled:bg-gray-50"
                            >
                                <option value="">Pilih Desa/Kelurahan</option>
                                {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                            {errors.villageId && <p className="text-red-500 text-xs mt-1">{errors.villageId.message}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap (Jalan, RT/RW)</label>
                            <textarea {...register('addressLine')} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-xl" placeholder="Jl. Contoh No. 123, RT 01/RW 02"></textarea>
                            {errors.addressLine && <p className="text-red-500 text-xs mt-1">{errors.addressLine.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Section 3: Kontak */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
                        <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">3</div>
                        Kontak & Darurat
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP / WhatsApp <span className="text-red-500">*</span></label>
                            <input {...register('phone')} type="tel" className="w-full px-4 py-2 border border-gray-300 rounded-xl" placeholder="08..." />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email (Opsional)</label>
                            <input {...register('email')} type="email" className="w-full px-4 py-2 border border-gray-300 rounded-xl" placeholder="email@contoh.com" />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kontak Darurat</span>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kontak Darurat</label>
                            <input {...register('emergencyName')} className="w-full px-4 py-2 border border-gray-300 rounded-xl" />
                            {errors.emergencyName && <p className="text-red-500 text-xs mt-1">{errors.emergencyName.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hubungan</label>
                            <select {...register('emergencyRelation')} className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-white">
                                <option value="">Pilih Hubungan</option>
                                <option value="Suami/Istri">Suami/Istri</option>
                                <option value="Orang Tua">Orang Tua</option>
                                <option value="Anak">Anak</option>
                                <option value="Saudara">Saudara</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                            {errors.emergencyRelation && <p className="text-red-500 text-xs mt-1">{errors.emergencyRelation.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP Darurat</label>
                            <input {...register('emergencyPhone')} type="tel" className="w-full px-4 py-2 border border-gray-300 rounded-xl" placeholder="08..." />
                            {errors.emergencyPhone && <p className="text-red-500 text-xs mt-1">{errors.emergencyPhone.message}</p>}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => reset()} className="px-6 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                        Reset Form
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" /> Simpan Data Pasien
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
