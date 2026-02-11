'use client';

import React, { useState, useEffect } from 'react';
import {
    Activity,
    Pill,
    Volume2,
    Calendar,
    Clock
} from 'lucide-react';
import {
    getQueue,
    getPrescriptions,
    subscribeToStatus,
    EncounterRecord
} from '@/lib/storage'; // Assuming store exists

export default function AntreanTVPage() {
    const [poliQueue, setPoliQueue] = useState<EncounterRecord[]>([]);
    const [pharmacyQueue, setPharmacyQueue] = useState<any[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    const fetchData = () => {
        // Fetch Poli Queue (In Progress / Called)
        const poli = getQueue('Poli Umum');
        setPoliQueue(poli);

        // Fetch Pharmacy Queue (Completed / Ready)
        const meds = getPrescriptions('completed');
        setPharmacyQueue(meds);
    };

    useEffect(() => {
        // Clock Update
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        // Data Sync
        fetchData();
        const unsubscribe = subscribeToStatus(fetchData);

        return () => {
            clearInterval(timer);
            unsubscribe();
        };
    }, []);

    const currentPoli = poliQueue[0]; // First in line being served
    const nextPoli = poliQueue.slice(1, 4);

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-slate-800 p-6 flex justify-between items-center shadow-2xl z-10">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Activity className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white uppercase">RSUD Digital Edge</h1>
                        <p className="text-slate-400 font-medium tracking-wide">Layanan Cepat & Akurat</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-black font-mono tracking-widest leading-none">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </h2>
                    <p className="text-slate-400 font-medium uppercase tracking-wider mt-1">
                        {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-2">
                {/* Left: Poli Queue */}
                <div className="border-r border-slate-700 bg-gradient-to-b from-slate-900 to-slate-800 p-8 flex flex-col">
                    <h2 className="text-2xl font-bold text-blue-400 mb-8 flex items-center gap-3 uppercase tracking-widest">
                        <UserIcon className="w-6 h-6" /> Antrean Poliklinik
                    </h2>

                    {/* Active Number */}
                    <div className="flex-1 flex flex-col items-center justify-center mb-12">
                        <span className="text-slate-400 text-2xl font-bold uppercase tracking-[0.2em] mb-4">Sedang Dipanggil</span>

                        {currentPoli ? (
                            <div className="bg-white text-slate-900 w-full max-w-lg aspect-square rounded-[3rem] flex flex-col items-center justify-center shadow-[0_0_100px_-20px_rgba(37,99,235,0.5)] animate-pulse-slow">
                                <span className="text-[12rem] font-black leading-none tracking-tighter tabular-nums">
                                    {currentPoli.id.substring(0, 3).toUpperCase()}
                                </span>
                                <span className="text-3xl font-bold text-blue-600 mt-4 px-8 py-2 bg-blue-50 rounded-full">
                                    {currentPoli.patientName}
                                </span>
                                <p className="text-slate-400 mt-4 text-xl font-medium">Silakan Masuk ke <span className="text-slate-900 font-bold">Ruang 1</span></p>
                            </div>
                        ) : (
                            <div className="text-slate-600 font-bold text-3xl italic">
                                -- Tidak ada antrean --
                            </div>
                        )}
                    </div>

                    {/* Next List */}
                    <div className="bg-slate-800/50 rounded-2xl p-6 backdrop-blur-sm border border-slate-700">
                        <h3 className="text-slate-400 font-bold uppercase tracking-wider text-sm mb-4">Selanjutnya</h3>
                        <div className="space-y-4">
                            {nextPoli.map((p, idx) => (
                                <div key={p.id} className="flex justify-between items-center p-4 bg-slate-800 rounded-xl border border-slate-700">
                                    <span className="font-mono text-2xl font-bold text-white tabular-nums">
                                        {p.id.substring(0, 3).toUpperCase()}
                                    </span>
                                    <span className="text-slate-300 font-medium truncate max-w-[200px]">{p.patientName}</span>
                                </div>
                            ))}
                            {nextPoli.length === 0 && <p className="text-slate-500 text-center py-2">-- Menunggu --</p>}
                        </div>
                    </div>
                </div>

                {/* Right: Pharmacy Queue */}
                <div className="bg-gradient-to-b from-slate-900 to-slate-800 p-8 flex flex-col">
                    <h2 className="text-2xl font-bold text-green-400 mb-8 flex items-center gap-3 uppercase tracking-widest">
                        <Pill className="w-6 h-6" /> Antrean Farmasi
                    </h2>

                    <div className="flex-1 grid grid-cols-2 gap-4 content-start">
                        {pharmacyQueue.slice(0, 10).map((med, idx) => (
                            <div key={med.id} className="bg-green-900/20 border border-green-800/50 p-6 rounded-2xl flex flex-col items-center justify-center animate-in zoom-in duration-300">
                                <span className="text-green-400 text-sm font-bold uppercase tracking-wider mb-2">Siap Ambil</span>
                                <span className="text-4xl font-black text-white mb-2">{med.data.subject.display}</span>
                                <span className="text-green-500 font-mono text-sm">{med.id.substring(0, 3).toUpperCase()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Marquee Ticker */}
            <div className="bg-blue-600 text-white p-3 overflow-hidden whitespace-nowrap relative z-10 shadow-lg">
                <div className="animate-marquee inline-block font-bold text-lg tracking-wide">
                    INFO: Mohon siapkan kartu BPJS Anda saat pendaftaran. Jam Besuk: Pagi 10:00-12:00, Sore 16:00-18:00. Tetap jaga protokol kesehatan di area Rumah Sakit. Terima kasih.
                </div>
            </div>
        </div>
    );
}

function UserIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
