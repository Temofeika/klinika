'use client'

import React, { useState, useEffect } from 'react'
import { PieChart, BarChart, TrendingUp, Users, DollarSign, Calendar, Activity } from 'lucide-react'

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

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Генерация отчетов...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="text-primary" />
            Аналитика и Отчеты
          </h1>
          <p className="text-sm text-slate-500">Статистика по работе клиники (Аналог финансового модуля Medialog)</p>
        </div>
        <button className="px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-xl text-sm font-semibold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition">
          <Calendar size={16} /> Последние 30 дней
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Выручка (Оплачено)</p>
            <h3 className="text-2xl font-extrabold text-slate-900">{stats?.totalRevenue?.toLocaleString() || 0} ₽</h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1"><TrendingUp size={12} /> +12% к прошлому месяцу</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Активные пациенты</p>
            <h3 className="text-2xl font-extrabold text-slate-900">{stats?.totalPatients || 0}</h3>
            <p className="text-xs text-slate-500 mt-1">Всего в базе данных</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Заказы лаборатории</p>
            <h3 className="text-2xl font-extrabold text-slate-900">{stats?.totalLabOrders || 0}</h3>
            <p className="text-xs text-slate-500 mt-1">Отправлено направлений</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <BarChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Выставлено счетов</p>
            <h3 className="text-2xl font-extrabold text-slate-900">{stats?.totalInvoices || 0}</h3>
            <p className="text-xs text-slate-500 mt-1">За весь период</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Doctors Load Report */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900 mb-4 border-b border-slate-100 pb-3">Нагрузка врачей (Пациенты)</h3>
          <div className="space-y-4">
            {stats?.doctors?.map((doc: any) => {
              const percentage = stats.totalPatients > 0 ? (doc._count.patients / stats.totalPatients) * 100 : 0
              return (
                <div key={doc.id}>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span className="text-slate-800">{doc.lastName} {doc.firstName}</span>
                    <span className="text-slate-500">{doc._count.patients} чел.</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              )
            })}
            {(!stats?.doctors || stats.doctors.length === 0) && (
              <p className="text-sm text-slate-500 text-center py-4">Нет данных</p>
            )}
          </div>
        </div>

        {/* Finance breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900 mb-4 border-b border-slate-100 pb-3">Финансовая сводка по статусам</h3>
          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase block mb-1">Поступило средств</span>
                <span className="text-xl font-extrabold text-emerald-600">{stats?.totalRevenue?.toLocaleString() || 0} ₽</span>
              </div>
              <DollarSign className="text-emerald-500 opacity-50 w-8 h-8" />
            </div>

            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase block mb-1">Дебиторская задолженность</span>
                <span className="text-xl font-extrabold text-amber-600">{stats?.unpaidRevenue?.toLocaleString() || 0} ₽</span>
              </div>
              <BarChart className="text-amber-500 opacity-50 w-8 h-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
