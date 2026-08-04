'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, User, Plus, Filter, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react'

interface Appointment {
  id: string
  startTime: string
  endTime: string
  status: string
  room?: string
  notes?: string
  patient: {
    id: string
    firstName: string
    lastName: string
    phone: string
  }
  doctor: {
    id: string
    firstName: string
    lastName: string
    position: string
    room?: string
    color?: string
  }
  service?: {
    id: string
    name: string
    price: number
  }
}

interface Doctor {
  id: string
  firstName: string
  lastName: string
  position: string
  room?: string
}

interface Service {
  id: string
  name: string
  price: number
}

interface ScheduleGridProps {
  onSelectPatient: (patientId: string) => void
}

export default function ScheduleGrid({ onSelectPatient }: ScheduleGridProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('ALL')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
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
  }, [selectedDoctorId, selectedDate])

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors')
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
      let url = `/api/appointments?date=${selectedDate}`
      if (selectedDoctorId !== 'ALL') {
        url += `&doctorId=${selectedDoctorId}`
      }
      const res = await fetch(url)
      const data = await res.json()
      if (Array.isArray(data)) setAppointments(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
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

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatientId || !modalDoctorId) return

    const [hours, minutes] = modalTime.split(':')
    const start = new Date(selectedDate)
    start.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    try {
      await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          doctorId: modalDoctorId,
          serviceId: modalServiceId || null,
          startTime: start.toISOString(),
          notes: modalNotes
        })
      })
      setIsModalOpen(false)
      fetchAppointments()
    } catch (e) {
      console.error(e)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"><UserCheck className="w-3.5 h-3.5" /> На приёме</span>
      case 'WAITING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300"><Clock className="w-3.5 h-3.5" /> Ожидает в холле</span>
      case 'CONFIRMED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300"><CheckCircle2 className="w-3.5 h-3.5" /> Подтвержден</span>
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">Завершен</span>
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">Записан</span>
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
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

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none bg-white"
            >
              <option value="ALL">Все врачи клиники</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  Д-р {d.lastName} {d.firstName} ({d.position})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            if (doctors.length) setModalDoctorId(doctors[0].id)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Новая запись в расписание
        </button>
      </div>

      {/* Appointment Cards Timeline */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 font-medium">Загрузка расписания...</div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-semibold">На выбранную дату нет записей</p>
          <p className="text-slate-400 text-sm">Нажмите кнопку выше, чтобы записать пациента к врачу</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((app) => {
            const timeStr = new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            return (
              <div
                key={app.id}
                className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-600" />
                      {timeStr} (Каб. {app.doctor.room || '101'})
                    </div>
                    {getStatusBadge(app.status)}
                  </div>

                  {/* Patient Name */}
                  <div 
                    onClick={() => onSelectPatient(app.patient.id)}
                    className="cursor-pointer group"
                  >
                    <h4 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" />
                      {app.patient.lastName} {app.patient.firstName}
                    </h4>
                    <p className="text-xs text-slate-500 pl-5">{app.patient.phone}</p>
                  </div>

                  {/* Doctor & Service */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                    <p><span className="font-semibold text-slate-700">Врач:</span> Д-р {app.doctor.lastName} ({app.doctor.position})</p>
                    {app.service && (
                      <p><span className="font-semibold text-slate-700">Услуга:</span> {app.service.name} ({app.service.price} ₽)</p>
                    )}
                    {app.notes && (
                      <p className="italic text-slate-500 mt-1">"{app.notes}"</p>
                    )}
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectPatient(app.patient.id)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Открыть ЭМК →
                  </button>

                  <div className="flex gap-1">
                    {app.status !== 'IN_PROGRESS' && app.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'IN_PROGRESS')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Принять
                      </button>
                    )}
                    {app.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleUpdateStatus(app.id, 'COMPLETED')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Завершить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
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
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
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
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
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
                <input
                  type="time"
                  value={modalTime}
                  onChange={(e) => setModalTime(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Услуга</label>
                <select
                  value={modalServiceId}
                  onChange={(e) => setModalServiceId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
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
