"use client";

import React, { useState, useEffect } from 'react';
import { CreditCard, FileText, CheckCircle, Clock, DollarSign, Search, Printer, X } from 'lucide-react';
import { getUnpaidInvoices, updateResourceStatus, subscribeToStatus, EncounterRecord } from '@/lib/storage';
import { PrintableInvoice } from '@/components/PrintableInvoice';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

interface InvoiceItem {
    description: string;
    amount: number;
}

interface Invoice {
    id: string;
    encounterId: string;
    patientName: string;
    date: string;
    status: 'paid' | 'pending' | 'unpaid';
    items: InvoiceItem[];
    total: number;
}

export default function BillingPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [showModal, setShowModal] = useState(false);

    const [loading, setLoading] = useState(true);

    const FEES = {
        ADMIN: 15000,
        CONSULT: 50000,
        MED_ITEM: 10000
    };

    useEffect(() => {
        const fetchData = () => {
            setLoading(true);
            const encounters = getUnpaidInvoices();

            // Generate invoices from Encounters
            const generatedInvoices: Invoice[] = encounters.map(enc => {
                const items: InvoiceItem[] = [];

                // 1. Admin Fee
                items.push({ description: 'Biaya Administrasi', amount: FEES.ADMIN });

                // 2. Consultation Fee
                items.push({ description: 'Jasa Konsultasi Dokter', amount: FEES.CONSULT });

                // 3. Medication Fee (Based on prescriptions count if available)
                if (enc.prescriptions && enc.prescriptions.length > 0) {
                    enc.prescriptions.forEach((p, idx) => {
                        items.push({ description: `Obat: ${p.medicationName} (${p.dosage})`, amount: FEES.MED_ITEM });
                    });
                } else if (enc.status === 'finished') {
                    // Fallback/Mock if no direct prescriptions but finished
                    items.push({ description: 'Paket Obat Standar', amount: 50000 });
                }

                const total = items.reduce((sum, item) => sum + item.amount, 0);

                return {
                    id: `INV-${enc.id.slice(0, 8).toUpperCase()}`,
                    encounterId: enc.id,
                    patientName: enc.patientName,
                    date: enc.timestamp,
                    status: enc.paymentStatus || 'pending', // Use from record
                    items: items,
                    total: total
                };
            });

            generatedInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setInvoices(generatedInvoices);
            setLoading(false);
        };

        fetchData();
        const unsubscribe = subscribeToStatus(fetchData);
        return () => unsubscribe();
    }, []);

    const handleProcessPayment = async () => {
        if (!selectedInvoice) return;

        try {
            // Update local state to reflect payment
            const updatedInvoices = invoices.map(inv =>
                inv.id === selectedInvoice.id ? { ...inv, status: 'paid' as const } : inv
            );
            setInvoices(updatedInvoices);
            setSelectedInvoice({ ...selectedInvoice, status: 'paid' });

            // Update PDB
            await updateResourceStatus(selectedInvoice.encounterId, 'Encounter', { paymentStatus: 'paid' });

            toast.success("Pembayaran Berhasil Diproses!");
        } catch (error) {
            console.error(error);
            toast.error("Gagal memproses pembayaran");
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const openInvoice = (inv: Invoice) => {
        setSelectedInvoice(inv);
        setShowModal(true);
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="w-8 h-8 text-green-600" />
                        Billing & Pembayaran
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">Invoice Management</p>
                </div>
                <div className="relative">
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                        type="text"
                        placeholder="Search Invoice or Patient..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Dashboard Cards (Hidden in Print) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Potential Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(invoices.reduce((acc, curr) => acc + curr.total, 0))}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Pending Payments</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {invoices.filter(i => i.status === 'pending').length} Invoices
                        </p>
                    </div>
                </div>
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Queue Pembayaran</h2>
                </div>
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-6">
                            <TableSkeleton />
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="p-12">
                            <EmptyState
                                icon={FileText}
                                title="Tidak Ada Tagihan"
                                description="Belum ada tagihan masuk dari unit lain."
                            />
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-sm">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Invoice ID</th>
                                    <th className="px-6 py-4 font-medium">Patient</th>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">Items</th>
                                    <th className="px-6 py-4 font-medium">Total</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openInvoice(inv)}>
                                        <td className="px-6 py-4 font-mono text-sm font-medium text-gray-600">{inv.id}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{inv.patientName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(inv.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{inv.items.length} items</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(inv.total)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${inv.status === 'paid'
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                }`}>
                                                {inv.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-blue-600 font-medium hover:text-blue-800 text-sm">
                                                View & Pay
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Invoice Detail Modal */}
            {showModal && selectedInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:hidden">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Invoice Detail</h3>
                                <p className="text-sm text-gray-500">{selectedInvoice.id}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="flex justify-between items-start mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <div>
                                    <label className="text-xs text-blue-600 font-bold uppercase tracking-wider">Billed To</label>
                                    <p className="text-xl font-bold text-gray-900">{selectedInvoice.patientName}</p>
                                </div>
                                <div className="text-right">
                                    <label className="text-xs text-blue-600 font-bold uppercase tracking-wider">Status</label>
                                    <p className={`text-lg font-bold ${selectedInvoice.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {selectedInvoice.status.toUpperCase()}
                                    </p>
                                </div>
                            </div>

                            <table className="w-full mb-6">
                                <thead className="border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-2 font-semibold text-gray-600">Description</th>
                                        <th className="text-right py-2 font-semibold text-gray-600">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedInvoice.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="py-3 text-gray-800">{item.description}</td>
                                            <td className="py-3 text-right font-mono text-gray-600">{formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-gray-100">
                                        <td className="pt-3 font-bold text-gray-900">TOTAL</td>
                                        <td className="pt-3 text-right font-bold text-xl text-blue-600">{formatCurrency(selectedInvoice.total)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
                            <button
                                onClick={handlePrint}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                <Printer className="w-5 h-5" /> Print Invoice
                            </button>
                            {selectedInvoice.status === 'pending' && (
                                <button
                                    onClick={handleProcessPayment}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 hover:bg-green-700 active:scale-95 transition-all"
                                >
                                    <CheckCircle className="w-5 h-5" /> Process Payment
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Print Component (Always Rendered, Hidden via CSS) */}
            <PrintableInvoice
                data={selectedInvoice ? {
                    ...selectedInvoice,
                    cashierName: "Dr. Yudhistira (Admin)" // Mock logged-in user
                } : null}
            />
        </div>
    );
}
