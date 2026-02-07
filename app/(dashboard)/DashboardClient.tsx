"use client";

import React, { useState, useEffect } from 'react';
import { Users, Activity, ClipboardList, Wifi, Database, Clock, ChevronRight, BarChart2, PieChart as PieIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getStatus, subscribeToStatus, getDecryptedRecords } from '../../lib/storage';
import { generateMockStats, DailyVisitStat, DiagnosisStat } from '../../lib/analytics';

export default function DashboardClient() {
  const [statsData, setStatsData] = useState({
    totalPatients: 0,
    todaysVisits: 0,
    synced: true
  });

  const [analyticsData, setAnalyticsData] = useState<{
    dailyVisits: DailyVisitStat[],
    diagnosisStats: DiagnosisStat[]
  }>({ dailyVisits: [], diagnosisStats: [] });

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    // Initial fetch
    const updateStats = () => {
      const status = getStatus();

      // Calculate today's visits from decrypted records
      const allEncounters = getDecryptedRecords('encounter') as any[];
      const todayStr = new Date().toISOString().split('T')[0];
      const todayVisits = allEncounters.filter(e => e.timestamp.startsWith(todayStr)).length;

      setStatsData({
        totalPatients: status.totalLocal,
        todaysVisits: todayVisits,
        synced: status.unsynced === 0
      });

      // Load Analytics Data
      // In a real scenario, we would calculate this from 'allEncounters' and 'Condition' resources
      // For now, we mix real data (today's count) with mock historical context if DB is empty
      const mocks = generateMockStats();
      setAnalyticsData(mocks);
    };

    updateStats();

    // Subscribe to changes
    const unsubscribe = subscribeToStatus(updateStats);
    return () => unsubscribe();
  }, []);

  const stats = [
    {
      label: 'Total Pasien Terdaftar',
      value: statsData.totalPatients.toLocaleString('id-ID'),
      icon: Users,
      color: 'bg-blue-600',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50'
    },
    {
      label: 'Kunjungan Hari Ini',
      value: statsData.todaysVisits.toLocaleString('id-ID'),
      icon: Activity,
      color: 'bg-green-600',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50'
    },
    {
      label: 'Menunggu Dokter',
      value: '12', // Mock for now
      icon: ClipboardList,
      color: 'bg-orange-500',
      textColor: 'text-orange-500',
      bgLight: 'bg-orange-50'
    },
    {
      label: 'Koneksi SATUSEHAT',
      value: statsData.synced ? 'Online & Synced' : 'Unsynced Data',
      icon: Wifi,
      color: statsData.synced ? 'bg-emerald-500' : 'bg-amber-500',
      textColor: statsData.synced ? 'text-emerald-600' : 'text-amber-600',
      bgLight: statsData.synced ? 'bg-emerald-50' : 'bg-amber-50',
      isStatus: true,
      isSynced: statsData.synced
    },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Selamat Pagi, dr. Yudhistira</h1>
          <p className="text-gray-500 mt-1 font-medium">{currentDate}</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
            Unduh Laporan
          </button>
          <button className="px-4 py-2 bg-blue-600 rounded-xl text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
            + Pasien Baru
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bgLight} ${stat.textColor} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
              {stat.isStatus && (
                <span className="flex h-3 w-3 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${stat.isSynced ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${stat.isSynced ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </span>
              )}
            </div>
            <div>
              <h3 className={`text-2xl font-bold text-gray-900 tracking-tight ${stat.isStatus ? 'text-lg' : ''}`}>{stat.value}</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-500" />
              Tren Kunjungan Pasien (7 Hari)
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.dailyVisits}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#2563EB', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="visits" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-purple-500" />
              Top 5 Diagnosa
            </h3>
          </div>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.diagnosisStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.diagnosisStats.map((entry, index) => (
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
                {analyticsData.diagnosisStats.reduce((a, b) => a + b.value, 0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
