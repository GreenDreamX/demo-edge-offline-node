// app/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Save, RefreshCw, Server, Activity } from 'lucide-react';

export default function Home() {
  const [records, setRecords] = useState<any[]>([]);
  const [status, setStatus] = useState<any>({});
  const [formData, setFormData] = useState({ name: '', nik: '', diagnosis: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    const res = await fetch('/api/records');
    const data = await res.json();
    setRecords(data.records.reverse());
    setStatus(data.status);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setFormData({ name: '', nik: '', diagnosis: '' });
    setLoading(false);
    fetchData();
  };

  const toggleOffline = async () => {
    await fetch('/api/records', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle-offline' }),
    });
    fetchData();
  };

  const triggerSync = async () => {
    await fetch('/api/records', {
      method: 'POST',
      body: JSON.stringify({ action: 'sync-now' }),
    });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Server className="text-blue-600" /> PKM Edge Server
            </h1>
            <p className="text-slate-500 text-sm">Unit: Puskesmas Terpencil 01</p>
          </div>
          <div className="flex gap-3">
            <button onClick={triggerSync} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition">
              <RefreshCw size={18} /> Sync Manual
            </button>
            <button onClick={toggleOffline} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white transition shadow-md ${status.isOffline ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
              {status.isOffline ? <WifiOff size={20}/> : <Wifi size={20}/>}
              {status.isOffline ? 'MODE OFFLINE' : 'ONLINE (SYNC ACTIVE)'}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700">
              <Activity size={20} className="text-green-600"/> Input Rekam Medis
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required className="w-full p-2.5 border border-slate-300 rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama Pasien" />
              <input required className="w-full p-2.5 border border-slate-300 rounded-lg" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} placeholder="NIK (16 Digit)" />
              <textarea required className="w-full p-2.5 border border-slate-300 rounded-lg h-24" value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} placeholder="Diagnosa Awal" />
              <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 font-medium transition flex justify-center items-center gap-2">
                <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Local'}
              </button>
            </form>
          </div>

          {/* List Log */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
            <h2 className="text-lg font-bold text-slate-700 mb-4">Log Database Lokal <span className="text-xs font-normal bg-slate-100 px-2 py-1 rounded ml-2">Pending: {status.unsynced || 0}</span></h2>
            <div className="flex-1 overflow-y-auto max-h-[400px] space-y-3 pr-2">
              {records.length === 0 ? <div className="text-center text-slate-400 py-10">Data Kosong</div> : records.map((rec: any) => (
                <div key={rec.id} className="p-4 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800">{rec.name}</h3>
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${rec.isSynced ? 'text-green-600 bg-green-100' : 'text-amber-600 bg-amber-100'}`}>
                      {rec.isSynced ? 'TERKIRIM' : 'LOCAL ONLY'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">NIK: {rec.nik}</p>
                  <p className="text-sm text-slate-500 italic">"{rec.diagnosis}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}