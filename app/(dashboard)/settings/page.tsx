"use client";

import React, { useState } from 'react';
import { Trash2, AlertTriangle, ShieldAlert, Loader2, CheckCircle } from 'lucide-react';
import { resetDatabase } from '@/lib/storage';
import { toast } from 'sonner';

export default function SettingsPage() {
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = async () => {
        if (!confirm("PERINGATAN KERAS: Semua data akan dihapus permanen! Apakah Anda yakin?")) return;

        setIsResetting(true);
        try {
            await resetDatabase();
            toast.success("Database berhasil di-reset. Halaman akan dimuat ulang...");
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error(error);
            toast.error("Gagal melakukan reset database.");
            setIsResetting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldAlert className="w-8 h-8 text-gray-700" />
                    Pengaturan Sistem
                </h1>
                <p className="text-gray-500 font-medium mt-1">Konfigurasi dan manajemen data lokal</p>
            </div>

            {/* DANGER ZONE */}
            <div className="bg-red-50 border border-red-100 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-red-100 bg-red-50/50">
                    <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Danger Zone
                    </h2>
                    <p className="text-red-600/80 text-sm mt-1">Area ini berisi tindakan yang bersifat destruktif dan tidak dapat dibatalkan.</p>
                </div>

                <div className="p-6 bg-white">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-gray-900">Reset Database Local</h3>
                            <p className="text-sm text-gray-500 mt-1 max-w-lg">
                                Menghapus semua data pasien, antrean, rekam medis, dan transaksi dari browser ini.
                                Gunakan fitur ini jika Anda ingin memulai demo dari awal (Fresh Install simulation).
                            </p>
                        </div>
                        <button
                            onClick={handleReset}
                            disabled={isResetting}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isResetting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-5 h-5" />
                                    Hapus Semua Data
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 text-sm">
                Build Version: Demo Edition v1.0.0
            </div>
        </div>
    );
}
