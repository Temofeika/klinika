'use client'

import React, { useState, useEffect } from 'react'
import { Check, X, ShieldAlert, Circle, Asterisk, Disc } from 'lucide-react'

// International tooth numbering (FDI World Dental Federation notation)
const TOOTH_NUMBERS = [
  // Upper Right (18 to 11)
  [18, 17, 16, 15, 14, 13, 12, 11],
  // Upper Left (21 to 28)
  [21, 22, 23, 24, 25, 26, 27, 28],
  // Lower Right (48 to 41)
  [48, 47, 46, 45, 44, 43, 42, 41],
  // Lower Left (31 to 38)
  [31, 32, 33, 34, 35, 36, 37, 38]
]

type ToothStatus = 'HEALTHY' | 'CARIES' | 'FILLED' | 'IMPLANT' | 'EXTRACTED' | 'CROWN'

const STATUS_COLORS: Record<ToothStatus, { bg: string, text: string, label: string, icon: any }> = {
  HEALTHY: { bg: 'bg-white', text: 'text-slate-700', label: 'Здоров', icon: Check },
  CARIES: { bg: 'bg-amber-100 border-amber-300', text: 'text-amber-700', label: 'Кариес', icon: ShieldAlert },
  FILLED: { bg: 'bg-blue-100 border-blue-300', text: 'text-blue-700', label: 'Пломба', icon: Circle },
  CROWN: { bg: 'bg-purple-100 border-purple-300', text: 'text-purple-700', label: 'Коронка', icon: Disc },
  IMPLANT: { bg: 'bg-indigo-100 border-indigo-300', text: 'text-indigo-700', label: 'Имплант', icon: Asterisk },
  EXTRACTED: { bg: 'bg-red-50 border-red-200 opacity-50 line-through', text: 'text-red-700', label: 'Удален', icon: X }
}

export default function PatientDental({ patientId }: { patientId: string }) {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  
  const fetchRecords = async () => {
    try {
      const res = await fetch(`/api/dental?patientId=${patientId}`)
      if (res.ok) {
        const data = await res.json()
        setRecords(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [patientId])

  const handleUpdateStatus = async (toothNumber: number, status: ToothStatus) => {
    try {
      // Optimistic UI update
      setRecords(prev => {
        const existing = prev.find(r => r.toothNumber === toothNumber)
        if (existing) {
          return prev.map(r => r.toothNumber === toothNumber ? { ...r, status } : r)
        }
        return [...prev, { toothNumber, status }]
      })
      setSelectedTooth(null)

      await fetch('/api/dental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, toothNumber, status })
      })
    } catch (e) {
      console.error('Failed to update tooth status', e)
      fetchRecords() // revert on fail
    }
  }

  const getToothStatus = (num: number): ToothStatus => {
    const record = records.find(r => r.toothNumber === num)
    return record ? record.status : 'HEALTHY'
  }

  const renderToothRow = (numbers: number[]) => (
    <div className="flex justify-center gap-1 sm:gap-2">
      {numbers.map(num => {
        const status = getToothStatus(num)
        const style = STATUS_COLORS[status]
        const isSelected = selectedTooth === num
        
        return (
          <div key={num} className="relative">
            <button
              onClick={() => setSelectedTooth(isSelected ? null : num)}
              className={`w-8 h-10 sm:w-10 sm:h-12 border-2 rounded-md flex flex-col items-center justify-center transition-all
                ${style.bg} ${style.text} ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 z-10' : 'border-slate-200 hover:border-slate-400'}
              `}
            >
              <span className="text-xs font-bold">{num}</span>
            </button>
            
            {isSelected && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white border border-slate-200 shadow-xl rounded-xl p-2 z-50 w-48 flex flex-col gap-1 animate-in zoom-in-95 duration-200">
                <div className="text-xs font-bold text-center text-slate-500 mb-1 border-b pb-1">Зуб {num}</div>
                {Object.entries(STATUS_COLORS).map(([s, cfg]) => (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(num, s as ToothStatus)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg hover:bg-slate-50 text-left w-full ${cfg.text}`}
                  >
                    <cfg.icon size={14} />
                    {cfg.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  if (loading) return <div className="p-8 text-center text-slate-500">Загрузка зубной формулы...</div>

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Стоматологическая карта (Зубная формула)</h2>
        <p className="text-sm text-slate-500">
          Интерактивная карта по системе FDI. Кликните на зуб, чтобы отметить кариес, пломбу или удаление.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm overflow-x-auto">
        <div className="min-w-[600px] flex flex-col gap-8 relative items-center justify-center">
          
          {/* Upper Jaw */}
          <div className="flex flex-col gap-2 items-center">
            <div className="text-sm font-bold text-slate-400 mb-2">Верхняя челюсть</div>
            <div className="flex gap-4 sm:gap-8">
              {renderToothRow(TOOTH_NUMBERS[0])} {/* 18-11 */}
              <div className="w-px bg-slate-300 mx-2"></div>
              {renderToothRow(TOOTH_NUMBERS[1])} {/* 21-28 */}
            </div>
          </div>

          <div className="h-px w-full bg-slate-200 max-w-3xl my-2 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-xs font-bold text-slate-400 border border-slate-200 rounded-full">
              Линия смыкания
            </div>
          </div>

          {/* Lower Jaw */}
          <div className="flex flex-col gap-2 items-center">
            <div className="flex gap-4 sm:gap-8">
              {renderToothRow(TOOTH_NUMBERS[2])} {/* 48-41 */}
              <div className="w-px bg-slate-300 mx-2"></div>
              {renderToothRow(TOOTH_NUMBERS[3])} {/* 31-38 */}
            </div>
            <div className="text-sm font-bold text-slate-400 mt-2">Нижняя челюсть</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {Object.entries(STATUS_COLORS).map(([key, cfg]) => (
          <div key={key} className={`flex items-center gap-2 p-2 rounded-lg border ${cfg.bg} ${cfg.text} bg-opacity-50`}>
            <cfg.icon size={16} />
            <span className="text-xs font-semibold">{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
