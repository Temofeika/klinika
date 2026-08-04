'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, User, Plus, Filter, CheckCircle2, UserCheck, Stethoscope } from 'lucide-react'

// Constants
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', 
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
]
const SLOT_HEIGHT = 60 // px per 30 minutes

interface Appointment {
  id: string
  startTime: string
  endTime: string
  status: string
  doctorId: string
  notes?: string
  patient: { id: string; firstName: string; lastName: string; phone: string }
  doctor: { id: string; firstName: string; lastName: string; position: string; room?: string }
  service?: { id: string; name: string; price: number }
}

interface Doctor {
  id: string
  firstName: string
  lastName: string
  position: string
  room?: string
  schedules?: any[]
}

export default function ScheduleGrid({ onSelectPatient }: { onSelectPatient: (id: string) => void }) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [services, setServices] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Drag and drop state
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [patientsList, setPatientsList] = useState<any[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [modalDoctorId, setModalDoctorId] = useState('')
  const [modalServiceId, setModalServiceId] = useState('')
  const [modalTime, setModalTime] = useState('10:00')
  const [modalNotes, setModalNotes] = useState('')

  useEffect(() => {
    fetchDoctors()
    fetchServices()
    fetchPatients()
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate])

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors/schedules')
      const data = await res.json()
      if (Array.isArray(data)) setDoctors(data)
    } catch (e) {}
  }

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services')
      const data = await res.json()
      if (Array.isArray(data)) setServices(data)
    } catch (e) {}
  }

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patient')
      const data = await res.json()
      if (Array.isArray(data)) setPatientsList(data)
    } catch (e) {}
  }

  const fetchAppointments = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/appointments?date=${selectedDate}`)
      const data = await res.json()
      if (Array.isArray(data)) setAppointments(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatientId || !modalDoctorId) return

    const [hours, minutes] = modalTime.split(':')
    const start = new Date(selectedDate)
    start.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    const end = new Date(start)
    end.setMinutes(end.getMinutes() + 30) // default 30 min duration

    try {
      await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          doctorId: modalDoctorId,
          serviceId: modalServiceId || null,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          notes: modalNotes
        })
      })
      setIsModalOpen(false)
      fetchAppointments()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggedAppId(appId)
    e.dataTransfer.effectAllowed = 'move'
    // Optional: set a transparent drag image or keep default
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, doctorId: string, timeSlot: string) => {
    e.preventDefault()
    if (!draggedAppId) return

    // Calculate new start time
    const [hours, minutes] = timeSlot.split(':')
    const newStart = new Date(selectedDate)
    newStart.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    // Calculate new end time based on old duration
    const app = appointments.find(a => a.id === draggedAppId)
    if (!app) return
    const oldStart = new Date(app.startTime)
    const oldEnd = new Date(app.endTime)
    const durationMs = oldEnd.getTime() - oldStart.getTime()
    const newEnd = new Date(newStart.getTime() + durationMs)

    // Optimistic UI update
    setAppointments(prev => prev.map(a => 
      a.id === draggedAppId 
        ? { ...a, doctorId, startTime: newStart.toISOString(), endTime: newEnd.toISOString() } 
        : a
    ))

    try {
      await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: draggedAppId,
          doctorId,
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString()
        })
      })
    } catch (e) {
      console.error(e)
      fetchAppointments() // rollback on error
    } finally {
      setDraggedAppId(null)
    }
  }

  const handleEmptySlotClick = (doctorId: string, timeSlot: string) => {
    setModalDoctorId(doctorId)
    setModalTime(timeSlot)
    setIsModalOpen(true)
  }

  const handleUpdateStatus = async (e: React.MouseEvent, id: string, newStatus: string) => {
    e.stopPropagation()
    try {
      await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })
      fetchAppointments()
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-emerald-100 border-emerald-400 border-l-4 text-emerald-900 shadow-emerald-500/20'
      case 'WAITING': return 'bg-amber-100 border-amber-400 border-l-4 text-amber-900 shadow-amber-500/20'
      case 'CONFIRMED': return 'bg-blue-100 border-blue-400 border-l-4 text-blue-900 shadow-blue-500/20'
      case 'COMPLETED': return 'bg-slate-100 border-slate-300 border-l-4 text-slate-500'
      default: return 'bg-sky-50 border-sky-400 border-l-4 text-sky-900' // BOOKED
    }
  }

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
          </div>
          <p className="text-sm text-slate-500 hidden sm:block">
            Подсказка: перетаскивайте визиты мышкой (Drag & Drop) или кликайте по свободным ячейкам.
          </p>
        </div>

        <button
          onClick={() => {
            setModalDoctorId(doctors[0]?.id || '')
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Новая запись
        </button>
      </div>

      {/* Grid Container */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl flex-1 flex flex-col overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Grid Header (Doctors) */}
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-hidden shrink-0">
          <div className="w-16 shrink-0 border-r border-slate-200 bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Время
          </div>
          <div className="flex-1 flex min-w-0">
            {doctors.filter(d => {
              const dayOfWeek = new Date(selectedDate).getDay()
              // If doctor has no schedules at all, show them (legacy support).
              if (!d.schedules || d.schedules.length === 0) return true
              // Otherwise, show only if they work on this day
              return d.schedules.some((s: any) => s.dayOfWeek === dayOfWeek)
            }).length === 0 && (
              <div className="flex-1 flex items-center justify-center p-3 text-slate-400 text-sm">
                Нет работающих врачей в этот день
              </div>
            )}
            {doctors.filter(d => {
              const dayOfWeek = new Date(selectedDate).getDay()
              if (!d.schedules || d.schedules.length === 0) return true
              return d.schedules.some((s: any) => s.dayOfWeek === dayOfWeek)
            }).map(doctor => {
              const dayOfWeek = new Date(selectedDate).getDay()
              const sched = doctor.schedules?.find((s: any) => s.dayOfWeek === dayOfWeek)
              return (
                <div key={doctor.id} className="flex-1 border-r border-slate-200 p-3 min-w-[200px] text-center">
                  <p className="font-bold text-sm text-slate-800 truncate" title={`${doctor.lastName} ${doctor.firstName}`}>
                    {doctor.lastName} {doctor.firstName[0]}.
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase">
                    {doctor.position} {doctor.room && `(Каб. ${doctor.room})`} 
                    {sched && ` • ${sched.startTime}-${sched.endTime}`}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Grid Body (Time slots) */}
        <div className="flex-1 overflow-y-auto overflow-x-auto">
          <div className="flex min-w-max relative" style={{ height: TIME_SLOTS.length * SLOT_HEIGHT }}>
            
            {/* Time Column */}
            <div className="w-16 shrink-0 border-r border-slate-200 bg-slate-50/50 sticky left-0 z-20">
              {TIME_SLOTS.map((time) => (
                <div key={time} className="text-xs text-slate-400 font-medium text-center pr-2 pt-2 border-b border-slate-100" style={{ height: SLOT_HEIGHT }}>
                  {time}
                </div>
              ))}
            </div>

            {/* Doctors Columns */}
            <div className="flex-1 flex relative">
              {doctors.filter(d => {
                const dayOfWeek = new Date(selectedDate).getDay()
                if (!d.schedules || d.schedules.length === 0) return true
                return d.schedules.some((s: any) => s.dayOfWeek === dayOfWeek)
              }).map(doctor => {
                const dayOfWeek = new Date(selectedDate).getDay()
                const sched = doctor.schedules?.find((s: any) => s.dayOfWeek === dayOfWeek)
                
                return (
                  <div key={doctor.id} className="flex-1 border-r border-slate-100 min-w-[200px] relative">
                    {/* Empty Drop Zones */}
                    {TIME_SLOTS.map((time) => {
                      // Optionally, visually disable slots outside of shift
                      let isWorkingHour = true
                      if (sched) {
                        const tMins = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1])
                        const startMins = parseInt(sched.startTime.split(':')[0]) * 60 + parseInt(sched.startTime.split(':')[1])
                        const endMins = parseInt(sched.endTime.split(':')[0]) * 60 + parseInt(sched.endTime.split(':')[1])
                        if (tMins < startMins || tMins >= endMins) isWorkingHour = false
                      }
                      
                      return (
                        <div 
                          key={time} 
                          className={`border-b ${isWorkingHour ? 'border-slate-100/50 hover:bg-blue-50/50 cursor-pointer' : 'border-slate-100/20 bg-slate-50/50 cursor-not-allowed'} transition-colors`}
                          style={{ height: SLOT_HEIGHT }}
                          onDragOver={isWorkingHour ? handleDragOver : undefined}
                          onDrop={isWorkingHour ? (e) => handleDrop(e, doctor.id, time) : undefined}
                          onClick={isWorkingHour ? () => handleEmptySlotClick(doctor.id, time) : undefined}
                        />
                      )
                    })}

                    {/* Render Appointments for this doctor */}
                    {appointments.filter(a => a.doctorId === doctor.id).map(app => {
                    const startDate = new Date(app.startTime)
                    const endDate = new Date(app.endTime)
                    const startHours = startDate.getHours()
                    const startMinutes = startDate.getMinutes()
                    const durationMins = (endDate.getTime() - startDate.getTime()) / 60000

                    // Calculate top offset based on 08:00 start
                    const startOffsetMins = (startHours - 8) * 60 + startMinutes
                    const topPx = (startOffsetMins / 30) * SLOT_HEIGHT
                    const heightPx = (durationMins / 30) * SLOT_HEIGHT

                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        onClick={() => onSelectPatient(app.patient.id)}
                        className={`absolute left-1 right-1 rounded-lg p-2 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:brightness-95 transition-all overflow-hidden z-10 ${getStatusColor(app.status)}`}
                        style={{ top: topPx, height: heightPx - 2 }}
                        title={`${app.patient.lastName} ${app.patient.firstName}\n${app.notes || 'Без примечаний'}`}
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-xs truncate max-w-[120px]">
                            {app.patient.lastName} {app.patient.firstName[0]}.
                          </p>
                          <span className="text-[9px] font-mono opacity-60">
                            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {heightPx >= SLOT_HEIGHT && (
                          <>
                            <p className="text-[10px] mt-0.5 truncate opacity-80">{app.service?.name || 'Первичный прием'}</p>
                            
                            {/* Action Buttons inside card (only if card is tall enough) */}
                            {heightPx >= SLOT_HEIGHT * 1.5 && (
                              <div className="mt-2 flex gap-1">
                                {app.status === 'BOOKED' && (
                                  <button onClick={(e) => handleUpdateStatus(e, app.id, 'WAITING')} className="text-[9px] bg-white/50 px-1.5 py-0.5 rounded hover:bg-white/80 transition">В холл</button>
                                )}
                                {app.status === 'WAITING' && (
                                  <button onClick={(e) => handleUpdateStatus(e, app.id, 'IN_PROGRESS')} className="text-[9px] bg-white/50 px-1.5 py-0.5 rounded hover:bg-white/80 transition">Принять</button>
                                )}
                                {app.status === 'IN_PROGRESS' && (
                                  <button onClick={(e) => handleUpdateStatus(e, app.id, 'COMPLETED')} className="text-[9px] bg-white/50 px-1.5 py-0.5 rounded hover:bg-white/80 transition">Завершить</button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">
              Новая запись в расписание
            </h3>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Выбор Пациента</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                >
                  <option value="">-- Выберите пациента --</option>
                  {patientsList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.lastName} {p.firstName} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Выбор Врача</label>
                <select
                  value={modalDoctorId}
                  onChange={(e) => setModalDoctorId(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      Д-р {d.lastName} {d.firstName} — {d.position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Время визита</label>
                <select
                  value={modalTime}
                  onChange={(e) => setModalTime(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                >
                  {TIME_SLOTS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Услуга</label>
                <select
                  value={modalServiceId}
                  onChange={(e) => setModalServiceId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
                >
                  <option value="">-- Без услуги / Первичный осмотр --</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.price} ₽)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Примечание</label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Жалобы, особенности..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition"
                >
                  Записать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
