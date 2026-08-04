'use client'

import React from 'react'
import { 
  Calendar, 
  Users, 
  TestTube2, 
  CreditCard, 
  MessageSquare, 
  Settings, 
  Activity,
  Stethoscope,
  PieChart,
  Package,
  BedDouble
} from 'lucide-react'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  unreadCount?: number
}

export default function Sidebar({ activeTab, setActiveTab, unreadCount = 0 }: SidebarProps) {
  const navItems = [
    { id: 'schedule', label: 'Расписание и Запись', icon: Calendar, color: 'text-blue-500' },
    { id: 'patients', label: 'Пациенты и ЭМК', icon: Users, color: 'text-emerald-500' },
    { id: 'labs', label: 'Лаборатория (ЛИС)', icon: TestTube2, color: 'text-purple-500' },
    { id: 'billing', label: 'Касса и Счета', icon: CreditCard, color: 'text-amber-500' },
    { id: 'warehouse', label: 'Склад', icon: Package, color: 'text-orange-500' },
    { id: 'inpatient', label: 'Стационар', icon: BedDouble, color: 'text-indigo-500' },
    { id: 'chat', label: 'Сообщения / Мессенджеры', icon: MessageSquare, color: 'text-sky-500', badge: unreadCount },
    { id: 'admin', label: 'Администрирование', icon: Settings, color: 'text-slate-400' },
    { id: 'reports', label: 'Отчеты и Аналитика', icon: PieChart, color: 'text-rose-500' },
  ]

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 shadow-xl select-none flex-shrink-0">
      {/* Clinic Logo Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
            МИС Клиника
            <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono">v8.1</span>
          </h1>
          <p className="text-xs text-slate-400">Медицинская система</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Основное меню
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.color}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span className="px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>

      {/* Doctor Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-blue-400">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">Д-р Иванов А.</p>
            <p className="text-[11px] text-slate-400 truncate">Терапевт (Каб. 101)</p>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="В сети" />
        </div>
      </div>
    </aside>
  )
}
