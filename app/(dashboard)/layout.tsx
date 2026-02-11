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
        { label: 'Pengaturan', icon: Settings, href: '/settings' },
    ];

    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 
                transform transition-transform duration-300 ease-in-out md:transform-none flex flex-col
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Brand Area */}
                <div className="h-20 flex items-center gap-3 px-8 border-b border-gray-50">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-gray-900">SIMRS Edge</h1>
                        <p className="text-xs text-gray-500 font-medium">Offline-First</p>
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
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' // Active: Blue tint + border
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900' // Inactive: Hover gray
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

                {/* User Profile */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3 p-2 rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                            dr
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 truncate">dr. Yudhistira</p>
                            <p className="text-xs text-gray-500 truncate">Dokter Umum</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${syncStatus.isOffline ? 'bg-gray-400' : 'bg-green-500'}`} title={syncStatus.isOffline ? "Offline" : "Online"}></div>
                    </div>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Sticky Header */}
                <header className="h-16 flex justify-between items-center px-6 md:px-8 sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-gray-200/50 supports-[backdrop-filter]:bg-white/60">
                    <div className="flex items-center gap-4">
                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                            <LayoutDashboard className="w-6 h-6" /> {/* Placeholder icon for hamburger logic usually */}
                            {/* Ideally use Menu icon but reusing existing imports for minimal diff */}
                        </button>

                        <div>
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight hidden md:block">
                                {menuItems.find(i => i.href === pathname)?.label || 'Dashboard'}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Sync Badge */}
                        <div
                            onClick={handleSync}
                            className={`cursor-pointer px-3 py-1.5 rounded-full border flex items-center gap-2 text-xs font-bold shadow-sm transition-all ${syncStatus.isOffline
                                ? 'bg-gray-100 border-gray-300 text-gray-600'
                                : (syncStatus.unsynced > 0
                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700')
                                }`}>
                            <div className={`w-2 h-2 rounded-full ${syncStatus.isOffline
                                ? 'bg-gray-500'
                                : (syncStatus.unsynced > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500')
                                }`}></div>
                            <span className="hidden sm:inline">
                                {syncStatus.isOffline
                                    ? 'OFFLINE'
                                    : (syncStatus.unsynced > 0 ? `${syncStatus.unsynced} PENDING` : 'SYNCED')}
                            </span>
                            {syncStatus.unsynced > 0 && <RefreshCw className="w-3 h-3 ml-1 animate-spin" />}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
