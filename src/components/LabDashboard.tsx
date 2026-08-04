'use client'

import React, { useState, useEffect } from 'react'
import { TestTube2, AlertTriangle, CheckCircle, Plus, Printer, FileText } from 'lucide-react'

interface LabResult {
  id: string
  parameterName: string
  value: string
  unit?: string
  referenceRange?: string
  isAbnormal: boolean
  notes?: string
}

interface LabOrder {
  id: string
  orderDate: string
  status: string
  notes?: string
  patient: {
    id: string
    firstName: string
    lastName: string
    phone: string
  }
  doctor: {
    firstName: string
    lastName: string
    position: string
  }
  service?: {
    name: string
    code: string
  }
  results: LabResult[]
}

export default function LabDashboard() {
  const [labOrders, setLabOrders] = useState<LabOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // New Parameter Form State
  const [paramName, setParamName] = useState('')
  const [paramValue, setParamValue] = useState('')
  const [paramUnit, setParamUnit] = useState('')
  const [paramRef, setParamRef] = useState('')
  const [paramAbnormal, setParamAbnormal] = useState(false)

  useEffect(() => {
    fetchLabOrders()
  }, [])

  const fetchLabOrders = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/labs')
      const data = await res.json()
      if (Array.isArray(data)) {
        setLabOrders(data)
        if (data.length > 0) setSelectedOrder(data[0])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder || !paramName || !paramValue) return

    try {
      await fetch('/api/labs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_RESULT',
          labOrderId: selectedOrder.id,
          parameterName: paramName,
          value: paramValue,
          unit: paramUnit,
          referenceRange: paramRef,
          isAbnormal: paramAbnormal
        })
      })

      // Reset form
      setParamName('')
      setParamValue('')
      setParamUnit('')
      setParamRef('')
      setParamAbnormal(false)

      fetchLabOrders()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left List of Orders */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <TestTube2 className="w-5 h-5 text-purple-600" />
            Лабораторные направления
          </h3>
          <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full">
            {labOrders.length}
          </span>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-400 text-center py-10">Загрузка направлений...</p>
        ) : labOrders.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">Нет активных лабораторных направлений</p>
        ) : (
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {labOrders.map(order => {
              const isSelected = selectedOrder?.id === order.id
              const hasAbnormal = order.results.some(r => r.isAbnormal)
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20'
                      : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-900">
                      {order.patient.lastName} {order.patient.firstName}
                    </span>
                    {hasAbnormal && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">
                        <AlertTriangle className="w-3 h-3" /> Отклонение
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{order.service?.name || 'Анализ крови'}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-400">
                    <span>Направлен: {new Date(order.orderDate).toLocaleDateString()}</span>
                    <span className="font-semibold text-slate-600">{order.results.length} показателей</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Right Details & Enter Results */}
      <div className="lg:col-span-2 space-y-6">
        {selectedOrder ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Бланк исследования</span>
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedOrder.patient.lastName} {selectedOrder.patient.firstName}
                </h2>
                <p className="text-xs text-slate-500">
                  Тел: {selectedOrder.patient.phone} | Назначил д-р: {selectedOrder.doctor.lastName} ({selectedOrder.doctor.position})
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                <Printer className="w-4 h-4" />
                Печать бланка
              </button>
            </div>

            {/* Results Table */}
            <div>
              <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Результаты показателей
              </h4>

              {selectedOrder.results.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-sm">
                  Результаты еще не внесены. Воспользуйтесь формой ниже.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-xs uppercase font-bold text-slate-600">
                      <tr>
                        <th className="p-3">Показатель</th>
                        <th className="p-3">Результат</th>
                        <th className="p-3">Ед. изм.</th>
                        <th className="p-3">Референсные значения</th>
                        <th className="p-3 text-center">Статус</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.results.map(r => (
                        <tr key={r.id} className={r.isAbnormal ? 'bg-rose-50/70 font-semibold' : ''}>
                          <td className="p-3 font-medium text-slate-900">{r.parameterName}</td>
                          <td className={`p-3 font-bold ${r.isAbnormal ? 'text-rose-600' : 'text-slate-800'}`}>
                            {r.value}
                          </td>
                          <td className="p-3 text-slate-500">{r.unit || '—'}</td>
                          <td className="p-3 text-slate-500">{r.referenceRange || '—'}</td>
                          <td className="p-3 text-center">
                            {r.isAbnormal ? (
                              <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-bold">
                                <AlertTriangle className="w-4 h-4" /> Выше/Ниже нормы
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                                <CheckCircle className="w-4 h-4" /> Норма
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Add Parameter Form */}
            <form onSubmit={handleAddResult} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700">Внести показатель</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Показатель</label>
                  <input
                    type="text"
                    value={paramName}
                    onChange={(e) => setParamName(e.target.value)}
                    placeholder="Например: Гемоглобин"
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Значение</label>
                  <input
                    type="text"
                    value={paramValue}
                    onChange={(e) => setParamValue(e.target.value)}
                    placeholder="Например: 140"
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Единица измерения</label>
                  <input
                    type="text"
                    value={paramUnit}
                    onChange={(e) => setParamUnit(e.target.value)}
                    placeholder="г/л"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Норма (Норматив)</label>
                  <input
                    type="text"
                    value={paramRef}
                    onChange={(e) => setParamRef(e.target.value)}
                    placeholder="120 - 160"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-600">
                  <input
                    type="checkbox"
                    checked={paramAbnormal}
                    onChange={(e) => setParamAbnormal(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  Отклонение от нормы!
                </label>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-500/20 transition"
                >
                  <Plus className="w-4 h-4" /> Добавить в бланк
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            Выберите направление слева для просмотра бланка
          </div>
        )}
      </div>
    </div>
  )
}
