'use client'

import React, { useState, useEffect } from 'react'
import { BedDouble, UserPlus, LogOut, CheckCircle2, User, Building2 } from 'lucide-react'

export default function InpatientDashboard() {
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modals state
  const [showAdmitModal, setShowAdmitModal] = useState(false)
  const [showDischargeModal, setShowDischargeModal] = useState(false)
  const [selectedBed, setSelectedBed] = useState<any>(null)
  
  // Admit Form State
  const [patients, setPatients] = useState<any[]>([])
  const [doctors, setDoctors] = useState<any[]>([])
  
  const [admitForm, setAdmitForm] = useState({
    patientId: '',
    doctorId: '',
    diagnosis: '',
    notes: ''
  })
  
  // Discharge Form State
  const [dischargeNotes, setDischargeNotes] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [deptRes, patRes, docRes] = await Promise.all([
        fetch('/api/inpatient/wards'),
        fetch('/api/patient'),
        fetch('/api/doctors')
      ])
      
      const depts = await deptRes.json()
      
      // Auto-seed if empty
      if (Array.isArray(depts) && depts.length === 0) {
        await fetch('/api/inpatient/wards', { method: 'POST' })
        const retryDepts = await (await fetch('/api/inpatient/wards')).json()
        setDepartments(Array.isArray(retryDepts) ? retryDepts : [])
      } else {
        setDepartments(Array.isArray(depts) ? depts : [])
      }
      
      const pats = await patRes.json()
      setPatients(Array.isArray(pats) ? pats : [])
      
      const docs = await docRes.json()
      setDoctors(Array.isArray(docs) ? docs : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleBedClick = (bed: any) => {
    setSelectedBed(bed)
    if (bed.status === 'AVAILABLE') {
      setAdmitForm({ patientId: '', doctorId: '', diagnosis: '', notes: '' })
      setShowAdmitModal(true)
    } else if (bed.status === 'OCCUPIED') {
      setDischargeNotes('')
      setShowDischargeModal(true)
    }
  }

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/inpatient/hospitalizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedId: selectedBed.id,
          ...admitForm
        })
      })
      if (res.ok) {
        setShowAdmitModal(false)
        fetchData()
      } else {
        const error = await res.json()
        alert('Ошибка: ' + (error.error || 'Не удалось госпитализировать'))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDischarge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBed || !selectedBed.hospitalizations?.[0]) return
    
    try {
      const res = await fetch('/api/inpatient/hospitalizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalizationId: selectedBed.hospitalizations[0].id,
          dischargeNotes
        })
      })
      if (res.ok) {
        setShowDischargeModal(false)
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const getBedStatusColor = (status: string) => {
    switch(status) {
      case 'AVAILABLE': return 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300'
      case 'OCCUPIED': return 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300'
      case 'MAINTENANCE': return 'bg-amber-50 border-amber-200 text-amber-700'
      default: return 'bg-slate-50 border-slate-200 text-slate-700'
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="text-blue-600" />
            Коечный фонд и Стационар
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Шахматка палат, контроль занятости коек и управление госпитализацией (Фаза 12).
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : departments.length === 0 ? (
        <div className="text-center p-12 text-slate-500 bg-white rounded-2xl border border-slate-200">Отделения не найдены.</div>
      ) : (
        <div className="space-y-8">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-800 p-4 border-b border-slate-700">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Building2 size={20} className="text-blue-400" />
                  {dept.name}
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dept.wards.map((ward: any) => (
                  <div key={ward.id} className="border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col">
                    <div className="p-3 border-b border-slate-200 bg-slate-100/50 flex justify-between items-center">
                      <span className="font-bold text-slate-800">{ward.number}</span>
                      <span className="text-xs font-semibold text-slate-500 uppercase">{ward.type === 'ICU' ? 'Реанимация' : 'Общая'}</span>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                      {ward.beds.map((bed: any) => {
                        const isOccupied = bed.status === 'OCCUPIED'
                        const hosp = isOccupied && bed.hospitalizations ? bed.hospitalizations[0] : null
                        
                        return (
                          <button
                            key={bed.id}
                            onClick={() => handleBedClick(bed)}
                            className={`flex flex-col p-3 rounded-lg border-2 text-left transition-all ${getBedStatusColor(bed.status)}`}
                          >
                            <div className="flex items-center justify-between w-full mb-2">
                              <span className="font-bold text-xs uppercase tracking-wider">{bed.number}</span>
                              <BedDouble size={16} className="opacity-70" />
                            </div>
                            
                            {isOccupied && hosp ? (
                              <div className="space-y-1">
                                <div className="text-xs font-bold truncate" title={`${hosp.patient?.lastName} ${hosp.patient?.firstName}`}>
                                  {hosp.patient?.lastName} {hosp.patient?.firstName[0]}.
                                </div>
                                <div className="text-[10px] font-medium opacity-80 line-clamp-2 leading-tight">
                                  Д/з: {hosp.diagnosis}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center flex-1 py-2">
                                <span className="text-xs font-bold uppercase tracking-wider opacity-70">Свободна</span>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admit Modal */}
      {showAdmitModal && selectedBed && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <UserPlus className="text-blue-600" />
              Госпитализация на {selectedBed.number}
            </h3>
            <form onSubmit={handleAdmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Пациент</label>
                <select required value={admitForm.patientId} onChange={e => setAdmitForm({...admitForm, patientId: e.target.value})} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- Выберите пациента --</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.lastName} {p.firstName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Лечащий врач (Стационар)</label>
                <select required value={admitForm.doctorId} onChange={e => setAdmitForm({...admitForm, doctorId: e.target.value})} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- Выберите врача --</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.lastName} {d.firstName} ({d.position})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Предварительный диагноз</label>
                <input type="text" required value={admitForm.diagnosis} onChange={e => setAdmitForm({...admitForm, diagnosis: e.target.value})} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Острый аппендицит?" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setShowAdmitModal(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50">Отмена</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow">Оформить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discharge Modal */}
      {showDischargeModal && selectedBed && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <LogOut className="text-rose-600" />
              Выписка из стационара
            </h3>
            {selectedBed.hospitalizations?.[0] && (
              <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-sm font-bold text-slate-800">
                  {selectedBed.hospitalizations[0].patient.lastName} {selectedBed.hospitalizations[0].patient.firstName}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Д/з: {selectedBed.hospitalizations[0].diagnosis}
                </p>
              </div>
            )}
            <form onSubmit={handleDischarge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Выписной эпикриз / Рекомендации</label>
                <textarea rows={4} value={dischargeNotes} onChange={e => setDischargeNotes(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Состояние удовлетворительное. Выписывается под наблюдение амбулаторного врача..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setShowDischargeModal(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50">Отмена</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow">Выписать пациента</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
