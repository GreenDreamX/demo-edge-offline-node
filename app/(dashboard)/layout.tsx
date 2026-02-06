"use client";

import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    UserPlus,
    Ambulance,
    Stethoscope,
    Bed,
    FileText,
    Pill,
    CreditCard,
    Settings,
    Wifi,
    Activity,
    LogOut,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getStatus, subscribeToStatus, trySync, toggleOfflineMode } from '../../lib/storage';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isOnline, setIsOnline] = useState(true);
    const [syncStatus, setSyncStatus] = useState({ unsynced: 0, isOffline: false });
    const pathname = usePathname();

    useEffect(() => {
        setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Subscribe to storage status
        const updateStatus = () => {
            const status = getStatus();
            setSyncStatus({
                unsynced: status.unsynced,
                isOffline: status.isOffline
            });
        };
        updateStatus();
        const unsubscribe = subscribeToStatus(updateStatus);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            unsubscribe();
        };
    }, []);

    const handleSync = async () => {
        await trySync();
    };

    const menuItems = [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
        { label: 'Pendaftaran', icon: UserPlus, href: '/pendaftaran' },
        { label: 'IGD', icon: Ambulance, href: '/igd' },
        { label: 'Poliklinik', icon: Stethoscope, href: '/poliklinik' },
        { label: 'Rawat Inap', icon: Bed, href: '/rawat-inap' },
        { label: 'Rekam Medis', icon: FileText, href: '/rekam-medis' },
        { label: 'Farmasi', icon: Pill, href: '/farmasi' },
        { label: 'Billing', icon: CreditCard, href: '/billing' },
        { label: 'Integrasi SATUSEHAT', icon: Settings, href: '/settings' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
            {/* Sidebar - Modern Minimalist */}
            <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-gray-200 hidden md:flex flex-col z-50 fixed h-full inset-y-0 left-0 transition-all duration-300">
                {/* Brand Area */}
                <div className="h-20 flex items-center gap-3 px-8 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-gray-900">JUKUT Health</h1>
                            <p className="text-xs text-gray-500 font-medium tracking-wide">Hospital Platform</p>
                        </div>
                    </div>
                    {/* Sidebar Status Dot */}
                    <div className="relative group cursor-help" title={syncStatus.unsynced > 0 ? `${syncStatus.unsynced} Unsynced Items` : 'All Synced'}>
                        <div className={`w-2.5 h-2.5 rounded-full ${syncStatus.isOffline ? 'bg-gray-400' : (syncStatus.unsynced > 0 ? 'bg-amber-500 animate-pulse' : 'bg-green-500')}`}></div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Menu Utama</p>
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/5'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                                    }`} />
                                {item.label}
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shadow-sm"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar Footer - User Profile */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white hover:shadow-sm hover:border border-transparent hover:border-gray-200 transition-all text-left">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 border border-white shadow-sm flex items-center justify-center text-blue-700 font-bold text-sm">
                            DY
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 truncate">dr. Yudhistira</p>
                            <p className="text-xs text-gray-500 truncate">Dokter Umum</p>
                        </div>
                        <Settings className="w-4 h-4 text-gray-400" />
                    </button>
                    <div className="mt-2 flex items-center justify-between px-2">
                        <span className="text-xs text-gray-400">Version 1.2.0</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${syncStatus.isOffline ? 'bg-gray-200 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                            {syncStatus.isOffline ? 'OFFLINE' : 'LIVE'}
                        </span>
                    </div>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 md:ml-72 flex flex-col min-h-screen transition-all duration-300">

                {/* Header - Transparent & Sticky */}
                <header className="h-20 flex justify-between items-center px-8 sticky top-0 z-40 backdrop-blur-md bg-gray-50/80 border-b border-gray-200/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                            {menuItems.find(i => i.href === pathname)?.label || 'Dashboard'}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>Instalasi Rawat Jalan</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div
                            onClick={handleSync}
                            className={`cursor-pointer px-4 py-2 rounded-full border flex items-center gap-2 text-xs font-bold shadow-sm transition-all ${syncStatus.isOffline
                                ? 'bg-gray-100 border-gray-300 text-gray-500'
                                : (syncStatus.unsynced > 0
                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-white border-green-200 text-green-700')
                                }`}>
                            <div className={`w-2 h-2 rounded-full ${syncStatus.isOffline
                                ? 'bg-gray-500'
                                : (syncStatus.unsynced > 0 ? 'bg-amber-500 animate-pulse' : 'bg-green-500')
                                }`}></div>
                            {syncStatus.isOffline
                                ? 'OFFLINE MODE'
                                : (syncStatus.unsynced > 0 ? `${syncStatus.unsynced} PENDING` : 'SYNCED')}
                            {syncStatus.unsynced > 0 && <RefreshCw className="w-3 h-3 ml-1 animate-spin" />}
                        </div>

                        <button className="w-10 h-10 rounded-full bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-all shadow-sm">
                            <Activity className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8 overflow-y-auto w-full max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
