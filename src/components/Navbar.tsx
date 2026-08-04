'use client'

import React, { useState } from 'react'
import { Search, UserPlus, CalendarPlus, Bell, Shield } from 'lucide-react'

interface NavbarProps {
  onSearchChange: (query: string) => void
  onOpenAddPatient: () => void
  onOpenNewAppointment?: () => void
  currentRole?: string
  setCurrentRole?: (role: string) => void
}

export default function Navbar({
  onSearchChange,
  onOpenAddPatient,
  onOpenNewAppointment,
  currentRole = 'Врач',
  setCurrentRole
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    onSearchChange(val)
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Global Search Bar */}
      <div className="relative w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Быстрый поиск пациента (ФИО, телефон, № карты)..."
          className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition"
        />
      </div>

      {/* Actions & Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Role Selector Badge */}
        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>Роль:</span>
          <select 
            value={currentRole} 
            onChange={(e) => setCurrentRole && setCurrentRole(e.target.value)}
            className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="Врач">Врач</option>
            <option value="Регистратор">Регистратор / Ресепшн</option>
            <option value="Кассир">Кассир</option>
            <option value="Лаборант">Лаборант</option>
            <option value="Администратор">Администратор</option>
          </select>
        </div>

        {/* Quick Add Buttons */}
        {onOpenNewAppointment && (
          <button
            onClick={onOpenNewAppointment}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200/60 transition active:scale-95"
          >
            <CalendarPlus className="w-4 h-4" />
            Записать на прием
          </button>
        )}

        <button
          onClick={onOpenAddPatient}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Новый пациент
        </button>

        {/* Notification Icon */}
        <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl relative transition">
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white" />
        </button>
      </div>
    </header>
  )
}
