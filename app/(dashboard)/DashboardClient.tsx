"use client";

import React, { useEffect, useState } from 'react';
import {
  Users,
  Activity,
  CreditCard,
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight,
  Wifi
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { PageHeader } from '@/components/ui/PageHeader';
import { getStatus, subscribeToStatus, getDecryptedRecords, PatientRecord, EncounterRecord } from '@/lib/storage';

export default function DashboardClient() {
  const [stats, setStats] = useState({
    patients: 0,
    visitsToday: 0,
    revenue: 0,
    pending: 0,
    synced: true
  });

  const [loading, setLoading] = useState(true);

  // Mock Data for Charts
  const data = [
    { name: 'Sen', visits: 45, revenue: 2400000 },
    { name: 'Sel', visits: 52, revenue: 3100000 },
    { name: 'Rab', visits: 38, revenue: 1800000 },
    { name: 'Kam', visits: 65, revenue: 4200000 },
    { name: 'Jum', visits: 48, revenue: 2900000 },
    { name: 'Sab', visits: 30, revenue: 1500000 },
    { name: 'Min', visits: 15, revenue: 800000 },
  ];

  const DIAGNOSIS_DATA = [
    { name: 'ISPA', value: 400 },
    { name: 'Hipertensi', value: 300 },
    { name: 'Diabetes', value: 300 },
    { name: 'Gastritis', value: 200 },
    { name: 'Demam', value: 278 },
  ];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    // Initial Load Logic
    const loadData = () => {
      const patients = getDecryptedRecords('patient') as PatientRecord[];
      const encounters = getDecryptedRecords('encounter') as EncounterRecord[];
      const today = new Date().toISOString().split('T')[0];
      const status = getStatus();

      const todayEncounters = encounters.filter(e => e.timestamp.startsWith(today));

      // Calculate Stats
      setStats({
        patients: patients.length,
        visitsToday: todayEncounters.length,
        revenue: todayEncounters.reduce((acc, curr) => acc + (curr.paymentStatus === 'paid' ? 150000 : 0), 0), // Mock revenue calc
        pending: encounters.filter(e => e.status === 'arrived').length,
        synced: status.unsynced === 0
      });
      setLoading(false);
    };

    loadData();
    const unsubscribe = subscribeToStatus(loadData);
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Dashboard Overview"
        description={`Selamat Pagi, dr. Yudhistira. Ringkasan aktivitas hari ini.`}
        action={
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pasien"
          value={stats.patients.toString()}
          icon={Users}
          trend="+12%"
          trendUp={true}
          color="blue"
        />
        <StatCard
          title="Kunjungan Hari Ini"
          value={stats.visitsToday.toString()}
          icon={Activity}
          trend="+5%"
          trendUp={true}
          color="emerald"
        />
        <StatCard
          title="Pendapatan (Est)"
          value={`Rp ${stats.revenue.toLocaleString('id-ID')}`}
          icon={CreditCard}
          trend="+18%"
          trendUp={true}
          color="violet"
        />
        <StatCard
          title="Koneksi SATUSEHAT"
          value={stats.synced ? 'Synced' : 'Pending'}
          icon={Wifi}
          trend={stats.synced ? 'Online' : 'Offline'}
          trendUp={stats.synced}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 text-lg">Statistik Kunjungan</h3>
            <select className="text-sm border-gray-200 rounded-lg bg-gray-50 px-2 py-1 outline-none focus:ring-2 focus:ring-blue-100">
              <option>7 Hari Terakhir</option>
              <option>30 Hari Terakhir</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Diagnosis Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              Top Diagnosa
            </h3>
          </div>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={DIAGNOSIS_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {DIAGNOSIS_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
              <span className="text-2xl font-bold text-gray-800">
                Top 5
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp, color }: any) {
  const colorClasses: any = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
      </div>
    </div>
  );
}
