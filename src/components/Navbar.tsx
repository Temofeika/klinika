'use client'

import React, { useState, useEffect } from 'react'
import { Search, UserPlus, CalendarPlus, Bell, Shield } from 'lucide-react'
import { format } from 'date-fns'

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
  const [reminders, setReminders] = useState<any[]>([])
  const [showReminders, setShowReminders] = useState(false)

  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set())
  const [activePopup, setActivePopup] = useState<any | null>(null)

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res = await fetch('/api/crm/reminders')
        if (res.ok) {
          const data = await res.json()
          setReminders(data)

          // Check if any task is due right now
          const now = new Date()
          for (const task of data) {
            if (task.plannedAt && new Date(task.plannedAt) <= now && !notifiedIds.has(task.id)) {
              setActivePopup(task)
              setNotifiedIds(prev => new Set(prev).add(task.id))
              // Auto close popup after 10 seconds
              setTimeout(() => setActivePopup(null), 10000)
              break; // Show one at a time
            }
          }
        }
      } catch (e) {}
    }
    fetchReminders()
    const interval = setInterval(fetchReminders, 60000)
    return () => clearInterval(interval)
  }, [notifiedIds])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    onSearchChange(val)
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
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

      <div className="flex items-center gap-3">
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
        <div className="relative">
          <button onClick={() => setShowReminders(!showReminders)} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl relative transition">
            <Bell className="w-5 h-5" />
            {reminders.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white animate-pulse" />
            )}
          </button>
          
          {showReminders && (
            <div className="absolute top-12 right-0 w-80 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden z-50">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-800 flex justify-between items-center">
                <span>Напоминания</span>
                <span className="bg-rose-100 text-rose-600 text-xs px-2 py-0.5 rounded-full">{reminders.length}</span>
              </div>
              <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                {reminders.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">Нет просроченных задач на сегодня.</div>
                ) : (
                  reminders.map(rem => (
                    <div key={rem.id} className="p-3 bg-white hover:bg-slate-50 rounded-xl cursor-pointer border border-transparent hover:border-slate-200 transition-all text-left">
                      <div className="text-xs font-bold text-rose-500 mb-1">
                        {format(new Date(rem.plannedAt), 'HH:mm')}
                      </div>
                      <div className="text-sm font-semibold text-slate-800 mb-1">{rem.lead?.name || rem.patient?.lastName}</div>
                      <div className="text-xs text-slate-600 line-clamp-2">{rem.content}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Popup Notification */}
      {activePopup && (
        <div className="fixed bottom-6 right-6 bg-white border border-red-200 rounded-2xl p-4 shadow-2xl shadow-red-500/20 z-50 flex gap-4 items-start w-80 animate-in slide-in-from-bottom-5">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-1">
            <Bell size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900 mb-1">Напоминание!</h4>
            <p className="text-xs text-slate-600 mb-2">{activePopup.content}</p>
            <p className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded inline-block">
              Время пришло
            </p>
          </div>
          <button onClick={() => setActivePopup(null)} className="text-slate-400 hover:text-slate-600 p-1">
            <Shield size={14} className="opacity-0" /> {/* dummy for spacing */}
            <span className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</span>
          </button>
        </div>
      )}
    </header>
  )
}
