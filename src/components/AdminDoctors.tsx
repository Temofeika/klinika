'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, User, Clock, Check, X, Stethoscope, Save } from 'lucide-react'

const DAYS_OF_WEEK = [
  { id: 1, name: 'Понедельник' },
  { id: 2, name: 'Вторник' },
  { id: 3, name: 'Среда' },
  { id: 4, name: 'Четверг' },
  { id: 5, name: 'Пятница' },
  { id: 6, name: 'Суббота' },
  { id: 0, name: 'Воскресенье' }
]

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Doctor currently being edited
  const [editingDoctor, setEditingDoctor] = useState<any>(null)
  
  // Local schedule state for the doctor being edited
  // Map of dayOfWeek -> { active, startTime, endTime, slotDuration }
  const [localSchedule, setLocalSchedule] = useState<any>({})

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/doctors/schedules')
      const data = await res.json()
      if (Array.isArray(data)) setDoctors(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (doctor: any) => {
    setEditingDoctor(doctor)
    
    // Initialize localSchedule from DB schedules
    const initSchedule: any = {}
    
    // Set defaults (inactive)
    DAYS_OF_WEEK.forEach(d => {
      initSchedule[d.id] = {
        active: false,
        startTime: '09:00',
        endTime: '18:00',
        slotDuration: 30
      }
    })
    
    // Override with existing schedules
    if (doctor.schedules && doctor.schedules.length > 0) {
      doctor.schedules.forEach((s: any) => {
        initSchedule[s.dayOfWeek] = {
          active: true,
          startTime: s.startTime,
          endTime: s.endTime,
          slotDuration: s.slotDuration
        }
      })
    }
    
    setLocalSchedule(initSchedule)
  }

  const handleToggleDay = (dayId: number) => {
    setLocalSchedule((prev: any) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        active: !prev[dayId].active
      }
    }))
  }

  const handleChangeTime = (dayId: number, field: string, value: string) => {
    setLocalSchedule((prev: any) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    if (!editingDoctor) return
    
    // Transform localSchedule back to array
    const schedulesToSave: any[] = []
    
    Object.keys(localSchedule).forEach(dayKey => {
      const dayId = parseInt(dayKey)
      const data = localSchedule[dayId]
      
      if (data.active) {
        schedulesToSave.push({
          dayOfWeek: dayId,
          startTime: data.startTime,
          endTime: data.endTime,
          slotDuration: data.slotDuration
        })
      }
    })
    
    try {
      const res = await fetch('/api/doctors/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: editingDoctor.id,
          schedules: schedulesToSave
        })
      })
      
      if (res.ok) {
        alert('График успешно сохранен!')
        setEditingDoctor(null)
        fetchDoctors() // Refresh list
      }
    } catch (e) {
      console.error(e)
      alert('Ошибка при сохранении графика')
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="text-blue-600 w-6 h-6" />
            Учет графиков врачей
          </h2>
          <p className="text-sm text-slate-500 mt-1">Управление сменами и расписанием специалистов (Фаза 11)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Doctors List */}
        <div className="md:col-span-1 border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
          <div className="bg-slate-50 p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Врачи клиники</h3>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Загрузка...</div>
            ) : doctors.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">Врачи не найдены</div>
            ) : (
              doctors.map(doc => {
                const isActive = editingDoctor?.id === doc.id
                const activeDaysCount = doc.schedules?.length || 0
                return (
                  <button
                    key={doc.id}
                    onClick={() => handleEdit(doc)}
                    className={`w-full text-left p-4 transition-colors flex items-center gap-3 ${isActive ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Stethoscope size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
                        {doc.firstName} {doc.lastName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{doc.position}</p>
                    </div>
                    {activeDaysCount > 0 ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full whitespace-nowrap">
                        {activeDaysCount} {activeDaysCount === 1 ? 'день' : activeDaysCount >= 2 && activeDaysCount <= 4 ? 'дня' : 'дней'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-1 rounded-full whitespace-nowrap">Нет графика</span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Schedule Editor */}
        <div className="md:col-span-2">
          {editingDoctor ? (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm h-full flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    График работы: {editingDoctor.firstName} {editingDoctor.lastName}
                  </h3>
                  <p className="text-sm text-slate-500">{editingDoctor.position}</p>
                </div>
                <button 
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-md shadow-blue-600/20"
                >
                  <Save size={16} /> Сохранить
                </button>
              </div>

              <div className="p-6 flex-1 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                  <div className="col-span-1"></div>
                  <div className="col-span-3 text-left">День недели</div>
                  <div className="col-span-3">Начало смены</div>
                  <div className="col-span-3">Конец смены</div>
                  <div className="col-span-2">Шаг приема</div>
                </div>

                {DAYS_OF_WEEK.map(day => {
                  const data = localSchedule[day.id]
                  if (!data) return null
                  const isActive = data.active

                  return (
                    <div key={day.id} className={`grid grid-cols-12 gap-4 items-center p-3 rounded-xl transition ${isActive ? 'bg-blue-50/50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'}`}>
                      <div className="col-span-1 flex justify-center">
                        <button 
                          onClick={() => handleToggleDay(day.id)}
                          className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${isActive ? 'bg-blue-600 text-white' : 'border-2 border-slate-300 text-transparent hover:border-blue-400'}`}
                        >
                          <Check size={14} className={isActive ? 'opacity-100' : 'opacity-0'} />
                        </button>
                      </div>
                      
                      <div className={`col-span-3 font-semibold text-sm ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                        {day.name}
                      </div>

                      <div className="col-span-3">
                        <input 
                          type="time"
                          value={data.startTime}
                          onChange={e => handleChangeTime(day.id, 'startTime', e.target.value)}
                          disabled={!isActive}
                          className={`w-full p-2 text-sm border rounded-lg outline-none transition-colors ${isActive ? 'bg-white border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
                        />
                      </div>

                      <div className="col-span-3">
                        <input 
                          type="time"
                          value={data.endTime}
                          onChange={e => handleChangeTime(day.id, 'endTime', e.target.value)}
                          disabled={!isActive}
                          className={`w-full p-2 text-sm border rounded-lg outline-none transition-colors ${isActive ? 'bg-white border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
                        />
                      </div>

                      <div className="col-span-2 relative">
                        <select
                          value={data.slotDuration}
                          onChange={e => handleChangeTime(day.id, 'slotDuration', e.target.value)}
                          disabled={!isActive}
                          className={`w-full p-2 text-sm border rounded-lg outline-none appearance-none transition-colors ${isActive ? 'bg-white border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                          <option value="15">15 м.</option>
                          <option value="20">20 м.</option>
                          <option value="30">30 м.</option>
                          <option value="45">45 м.</option>
                          <option value="60">60 м.</option>
                        </select>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 border-dashed rounded-2xl h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 p-10 text-center">
              <Calendar className="w-16 h-16 mb-4 text-slate-300 opacity-50" />
              <h3 className="text-lg font-bold text-slate-600 mb-2">График не выбран</h3>
              <p className="text-sm max-w-sm">Выберите врача из списка слева, чтобы настроить его рабочие дни, часы приема и длительность одной консультации.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
