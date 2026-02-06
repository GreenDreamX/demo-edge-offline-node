import React from 'react';

interface InvoiceData {
    id: string;
    date: string;
    patientName: string;
    items: {
        description: string;
        amount: number;
    }[];
    total: number;
    cashierName: string;
}

export const PrintableInvoice = ({ data }: { data: InvoiceData | null }) => {
    if (!data) return null;

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

    return (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black font-serif">
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">RS SEHAT SEJAHTERA</h1>
                    <p className="text-sm">Jl. Kesehatan No. 123, Jakarta Selatan</p>
                    <p className="text-sm">Telp: (021) 555-0123 | Email: admin@rs-sehat.com</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-gray-600">INVOICE</h2>
                    <p className="font-mono mt-1 text-lg">{data.id}</p>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="font-bold text-gray-600 text-sm uppercase mb-1">Billed To</h3>
                    <p className="text-xl font-bold">{data.patientName}</p>
                    <p>Patient ID: {data.id.split('-')[1]}</p>
                </div>
                <div className="text-right">
                    <h3 className="font-bold text-gray-600 text-sm uppercase mb-1">Date</h3>
                    <p>{new Date(data.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </div>

            {/* Table */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b-2 border-gray-800">
                        <th className="text-left py-2 font-bold uppercase text-sm">Description</th>
                        <th className="text-right py-2 font-bold uppercase text-sm">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                    {data.items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="py-3">{item.description}</td>
                            <td className="py-3 text-right font-mono">{formatCurrency(item.amount)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-gray-800">
                        <td className="pt-4 font-bold text-lg text-right pr-8">TOTAL</td>
                        <td className="pt-4 font-bold text-lg text-right font-mono">{formatCurrency(data.total)}</td>
                    </tr>
                </tfoot>
            </table>

            {/* Footer / Signature */}
            <div className="flex justify-between items-end mt-20">
                <div className="text-sm text-gray-500">
                    <p>Thank you for choosing RS Sehat Sejahtera.</p>
                    <p>Get well soon!</p>
                </div>
                <div className="text-center">
                    <p className="mb-16 font-bold">{data.cashierName}</p>
                    <div className="border-t border-gray-400 w-48 mx-auto"></div>
                    <p className="text-xs uppercase mt-1">Authorized Signature</p>
                </div>
            </div>
        </div>
    );
};
