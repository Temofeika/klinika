'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Activity, Thermometer, Heart, Pill, Save, X } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function PatientObservation({ patientId, hospitalizationId }: { patientId: string, hospitalizationId: string }) {
  const [observations, setObservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    medications: '',
    notes: ''
  })

  const fetchObservations = async () => {
    try {
      const res = await fetch(`/api/inpatient/observations?hospitalizationId=${hospitalizationId}`)
      if (res.ok) {
        const data = await res.json()
        setObservations(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hospitalizationId) {
      fetchObservations()
    }
  }, [hospitalizationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/inpatient/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalizationId,
          ...form
        })
      })
      if (res.ok) {
        setForm({ temperature: '', bloodPressure: '', heartRate: '', medications: '', notes: '' })
        setShowAdd(false)
        fetchObservations()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Загрузка данных...</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="text-blue-500" /> Температурный лист и назначения
          </h2>
          <p className="text-sm text-slate-500">Мониторинг витальных показателей пациента в стационаре</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <Plus size={18} /> Добавить запись
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-md mb-6 relative">
          <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
          <h3 className="font-bold text-slate-800 mb-4">Новая запись</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1"><Thermometer size={14}/> Температура (C)</label>
              <input type="number" step="0.1" value={form.temperature} onChange={e => setForm({...form, temperature: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="36.6" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1"><Activity size={14}/> Давление (АД)</label>
              <input type="text" value={form.bloodPressure} onChange={e => setForm({...form, bloodPressure: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="120/80" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1"><Heart size={14}/> Пульс (уд/мин)</label>
              <input type="number" value={form.heartRate} onChange={e => setForm({...form, heartRate: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="72" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1"><Pill size={14}/> Выданы лекарства</label>
              <input type="text" value={form.medications} onChange={e => setForm({...form, medications: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Парацетамол 1т" />
            </div>
            <div className="lg:col-span-4 flex items-center gap-4 mt-2">
              <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Дополнительные заметки..." />
              <button type="submit" disabled={saving} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                <Save size={16} /> {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      )}

      {observations.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 text-slate-500">
          Записей пока нет.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                <th className="p-4 font-semibold">Дата и Время</th>
                <th className="p-4 font-semibold">Температура</th>
                <th className="p-4 font-semibold">АД</th>
                <th className="p-4 font-semibold">Пульс</th>
                <th className="p-4 font-semibold">Лекарства</th>
                <th className="p-4 font-semibold">Заметки</th>
              </tr>
            </thead>
            <tbody>
              {observations.map((obs) => (
                <tr key={obs.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm">
                  <td className="p-4 font-medium text-slate-800">
                    {format(new Date(obs.recordedAt), 'dd.MM.yyyy HH:mm')}
                  </td>
                  <td className="p-4">
                    {obs.temperature ? (
                      <span className={`font-semibold ${obs.temperature >= 37.5 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {obs.temperature} °C
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-4 font-medium text-slate-700">{obs.bloodPressure || '-'}</td>
                  <td className="p-4 font-medium text-slate-700">{obs.heartRate || '-'}</td>
                  <td className="p-4 text-slate-600">{obs.medications || '-'}</td>
                  <td className="p-4 text-slate-500">{obs.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
