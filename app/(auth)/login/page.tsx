"use client";

import React, { useState } from 'react';
import { Activity, Lock, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Set Session Cookie
        document.cookie = "jukut_session=valid; path=/; max-age=86400; SameSite=Lax";

        // Dummy logic - accept anything
        setLoading(false);
        router.push('/');
    };

    return (
        <div className="flex min-h-screen bg-white">
            {/* Left Side - Illustration (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-slate-900/40 z-10 mix-blend-multiply"></div>
                <Image
                    src="/hospital-login-bg.png"
                    alt="Hospital Building"
                    fill
                    className="object-cover opacity-80"
                    priority
                />
                <div className="relative z-20 flex flex-col justify-end p-12 text-white h-full">
                    <div className="mb-6">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                            <Activity className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight mb-4 leading-tight">Sistem Informasi Manajemen Rumah Sakit Terintegrasi</h2>
                        <p className="text-blue-100 text-lg max-w-md">Mengelola data pasien, rekam medis, dan layanan kesehatan dengan aman, cepat, dan efisien.</p>
                    </div>
                    <div className="flex gap-4 text-sm font-medium text-blue-200/80">
                        <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Real-time Data</span>
                        <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Secure Encryption</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-white relative">
                <div className="w-full max-w-md space-y-8">

                    {/* Header */}
                    <div className="text-center lg:text-left">
                        <div className="inline-flex lg:hidden items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-6 shadow-lg shadow-blue-600/20">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Selamat Datang</h1>
                        <p className="text-slate-500 mt-2">Silahkan masuk menggunakan akun staf anda.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Email Address</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    placeholder="nama@rs-jukut.co.id"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold text-slate-700">Password</label>
                                <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700">Lupa password?</a>
                            </div>
                            <div className="relative">
                                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 text-slate-800"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Masuk Portal <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-center lg:justify-start gap-3">
                            <Image src="/next.svg" width={20} height={20} alt="Logo" className="opacity-20 hidden" /> {/* Placeholder/Fix if needed later */}
                            <p className="text-xs text-slate-400 font-medium">
                                Terintegrasi dengan <strong className="text-slate-600">SATUSEHAT Kemenkes</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
