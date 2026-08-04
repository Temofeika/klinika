'use client'

import React, { useState, useEffect } from 'react'
import { Search, UserPlus, FileText, Clock, Phone, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface PatientDirectoryProps {
  onSelectPatient: (id: string) => void
  onAddPatient: () => void
}

export default function PatientDirectory({ onSelectPatient, onAddPatient }: PatientDirectoryProps) {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch('/api/patient')
        const data = await res.json()
        if (Array.isArray(data)) {
          setPatients(data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchPatients()
  }, [])

  const filteredPatients = patients.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    (p.phone && p.phone.includes(search))
  )

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">База пациентов</h2>
          <p className="text-sm text-slate-500 mt-1">
            Выберите пациента для просмотра медицинской карты или добавьте нового.
          </p>
        </div>
        <button 
          onClick={onAddPatient}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
        >
          <UserPlus size={18} />
          Новый пациент
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 flex items-center gap-2">
        <Search className="text-slate-400 ml-2" size={20} />
        <input 
          type="text" 
          placeholder="Поиск по ФИО или телефону..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-2 py-2 text-sm outline-none bg-transparent"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-slate-200">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
            <Search size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Пациенты не найдены</h3>
          <p className="text-sm text-slate-500 mt-1">Попробуйте изменить параметры поиска или добавьте нового пациента.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((p) => {
            const hasUnread = p.messages && p.messages.some((m: any) => m.isIncoming && !m.isRead)
            return (
              <div 
                key={p.id} 
                onClick={() => onSelectPatient(p.id)}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative group"
              >
                {hasUnread && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                )}
                
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-lg truncate">
                      {p.lastName} {p.firstName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-0.5">
                      <Phone size={14} />
                      <span className="truncate">{p.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><FileText size={14} /> Лечащие врачи:</span>
                    <span className="font-semibold text-slate-700">
                      {p.doctors?.length > 0 ? p.doctors.length : 'Не назначены'}
                    </span>
                  </div>
                  {p.lastMessageAt && (
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><Clock size={14} /> Последняя активность:</span>
                      <span className="font-semibold text-slate-700">
                        {format(new Date(p.lastMessageAt), 'd MMM HH:mm', { locale: ru })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
