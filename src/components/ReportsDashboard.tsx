'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, Users, DollarSign, Calendar, Activity, Download } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ReportsDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/reports')
      const data = await res.json()
      setStats(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!stats) return

    const csvRows = []
    csvRows.push(['Метрика', 'Значение'])
    csvRows.push(['Выручка (Оплачено)', stats.totalRevenue || 0])
    csvRows.push(['Дебиторская задолженность', stats.unpaidRevenue || 0])
    csvRows.push(['Активные пациенты', stats.totalPatients || 0])
    csvRows.push(['Счетов выставлено', stats.totalInvoices || 0])
    csvRows.push(['Заказов лаборатории', stats.totalLabOrders || 0])
    csvRows.push([])
    csvRows.push(['Нагрузка врачей'])
    csvRows.push(['Врач', 'Количество пациентов'])
    
    stats.doctors?.forEach((doc: any) => {
      csvRows.push([`Д-р ${doc.lastName} ${doc.firstName}`, doc._count.patients])
    })

    const csvString = csvRows.map(row => row.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `klinika_report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return <div className="p-10 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      Генерация отчетов и графиков...
    </div>
  }

  // Prepare data for recharts
  const financeData = [
    { name: 'Поступило', value: stats?.totalRevenue || 0, color: '#10b981' }, // emerald-500
    { name: 'Задолженность', value: stats?.unpaidRevenue || 0, color: '#f59e0b' }, // amber-500
  ]

  const doctorData = stats?.doctors?.map((doc: any) => ({
    name: doc.lastName,
    patients: doc._count.patients
  })) || []

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="text-blue-600 w-7 h-7" />
            Аналитика и Отчеты
          </h1>
          <p className="text-sm text-slate-500 mt-1">Детальная финансовая и статистическая аналитика клиники</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-xl text-sm font-semibold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition">
            <Calendar size={16} className="text-blue-600" /> Текущий месяц
          </button>
          <button 
            onClick={exportToCSV}
            className="px-4 py-2 bg-emerald-600 border border-emerald-700 shadow-sm rounded-xl text-sm font-semibold text-white flex items-center gap-2 hover:bg-emerald-700 transition"
          >
            <Download size={16} /> Экспорт (CSV)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full"><TrendingUp size={12} /> +12%</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Выручка (Оплачено)</p>
          <h3 className="text-2xl font-black text-slate-900">{stats?.totalRevenue?.toLocaleString() || 0} ₽</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Активные пациенты</p>
          <h3 className="text-2xl font-black text-slate-900">{stats?.totalPatients || 0}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Заказы лаборатории</p>
          <h3 className="text-2xl font-black text-slate-900">{stats?.totalLabOrders || 0}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition">
          <div className="flex items-start justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Выставлено счетов</p>
          <h3 className="text-2xl font-black text-slate-900">{stats?.totalInvoices || 0}</h3>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Finance Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-lg text-slate-900 mb-6 border-b border-slate-100 pb-3">Финансовая сводка</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={financeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {financeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => `${value.toLocaleString()} ₽`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
             <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
               <p className="text-xs text-emerald-800 font-bold uppercase mb-1">Поступило</p>
               <p className="text-lg font-black text-emerald-600">{stats?.totalRevenue?.toLocaleString() || 0} ₽</p>
             </div>
             <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
               <p className="text-xs text-amber-800 font-bold uppercase mb-1">Задолженность</p>
               <p className="text-lg font-black text-amber-600">{stats?.unpaidRevenue?.toLocaleString() || 0} ₽</p>
             </div>
          </div>
        </div>

        {/* Doctors Load Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-lg text-slate-900 mb-6 border-b border-slate-100 pb-3">Нагрузка врачей (Пациенты)</h3>
          <div className="flex-1 min-h-[300px]">
            {doctorData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doctorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="patients" name="Количество пациентов" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Нет данных о пациентах
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
