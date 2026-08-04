'use client'

import React, { useState, useEffect } from 'react'
import { DollarSign, Clock, Users, ChevronLeft, ChevronRight, CheckCircle, Search, Edit3 } from 'lucide-react'
import { format, subMonths, addMonths } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function PayrollDashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [payrollData, setPayrollData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null)
  
  // For modal form
  const [editingDoc, setEditingDoc] = useState<any | null>(null)
  const [bonus, setBonus] = useState(0)
  const [penalty, setPenalty] = useState(0)
  const [saving, setSaving] = useState(false)

  const fetchPayroll = async (date: Date) => {
    setLoading(true)
    try {
      const monthStr = format(date, 'yyyy-MM')
      const res = await fetch(`/api/payroll?month=${monthStr}`)
      if (res.ok) {
        const data = await res.json()
        setPayrollData(data)
        if (data.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(data[0].doctor.id)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayroll(currentMonth)
  }, [currentMonth])

  const prevMonth = () => setCurrentMonth(prev => subMonths(prev, 1))
  const nextMonth = () => setCurrentMonth(prev => addMonths(prev, 1))

  const handleClockIn = async (doctorId: string) => {
    try {
      await fetch('/api/payroll/timesheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, action: 'CLOCK_IN' })
      })
      fetchPayroll(currentMonth)
    } catch (e) { console.error(e) }
  }

  const handleClockOut = async (doctorId: string) => {
    try {
      await fetch('/api/payroll/timesheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, action: 'CLOCK_OUT' })
      })
      fetchPayroll(currentMonth)
    } catch (e) { console.error(e) }
  }

  const saveAdjustment = async () => {
    if (!editingDoc) return
    setSaving(true)
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      
      const newTotal = editingDoc.commission + bonus - penalty

      await fetch('/api/payroll/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: editingDoc.doctor.id,
          periodStart: startOfMonth,
          periodEnd: endOfMonth,
          baseAmount: editingDoc.commission,
          bonus,
          penalty,
          totalAmount: newTotal,
          status: editingDoc.status
        })
      })
      
      setEditingDoc(null)
      fetchPayroll(currentMonth)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const markAsPaid = async (doc: any) => {
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
      
      await fetch('/api/payroll/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: doc.doctor.id,
          periodStart: startOfMonth,
          periodEnd: endOfMonth,
          baseAmount: doc.commission,
          bonus: doc.bonus,
          penalty: doc.penalty,
          totalAmount: doc.totalPayout,
          status: 'PAID'
        })
      })
      fetchPayroll(currentMonth)
    } catch (e) {
      console.error(e)
    }
  }

  const selectedData = payrollData.find(d => d.doctor.id === selectedDoctorId)

  return (
    <div className="p-8 pb-32 h-screen overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <DollarSign className="text-emerald-500" size={32} />
            Зарплата и Табель
          </h1>
          <p className="text-slate-500 mt-2">Управление начислениями, расчетом комиссий и рабочим временем</p>
        </div>

        <div className="flex items-center gap-4 bg-white rounded-xl shadow-sm border border-slate-200 p-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="w-40 text-center font-bold text-slate-800 capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale: ru })}
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">Загрузка данных...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Doctors List */}
          <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 h-[calc(100vh-200px)] overflow-y-auto">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">Сотрудники</div>
            <div className="flex flex-col gap-2">
              {payrollData.map((d) => (
                <button
                  key={d.doctor.id}
                  onClick={() => setSelectedDoctorId(d.doctor.id)}
                  className={`p-3 rounded-2xl text-left transition-all ${selectedDoctorId === d.doctor.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'hover:bg-slate-50 border-transparent'} border flex flex-col gap-1`}
                >
                  <div className="font-bold text-slate-800 text-sm">{d.doctor.firstName} {d.doctor.lastName}</div>
                  <div className="text-xs text-slate-500 flex justify-between">
                    <span>{d.doctor.position}</span>
                    <span className={d.status === 'PAID' ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                      {d.totalPayout.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Payroll Details */}
          {selectedData && (
            <div className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="text-slate-500 text-sm font-semibold mb-1">Выручка клиники</div>
                  <div className="text-2xl font-black text-slate-900">{selectedData.servicesTotal.toLocaleString('ru-RU')} ₽</div>
                  <DollarSign className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-100 group-hover:scale-110 transition-transform" />
                </div>
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="text-slate-500 text-sm font-semibold mb-1">Ставка врача</div>
                  <div className="text-2xl font-black text-blue-600">{selectedData.doctor.commissionRate}%</div>
                  <div className="text-sm font-bold text-slate-400 mt-1">{selectedData.commission.toLocaleString('ru-RU')} ₽</div>
                </div>
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="text-slate-500 text-sm font-semibold mb-1">Корректировки</div>
                  <div className="flex gap-3 text-lg font-black">
                    <span className="text-emerald-500">+{selectedData.bonus}</span>
                    <span className="text-red-500">-{selectedData.penalty}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setBonus(selectedData.bonus)
                      setPenalty(selectedData.penalty)
                      setEditingDoc(selectedData)
                    }}
                    className="absolute top-4 right-4 text-slate-300 hover:text-blue-500 transition-colors"
                  >
                    <Edit3 size={18} />
                  </button>
                </div>
                <div className={`rounded-3xl p-5 border shadow-sm relative overflow-hidden group ${selectedData.status === 'PAID' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-900 border-slate-800'}`}>
                  <div className={`text-sm font-semibold mb-1 ${selectedData.status === 'PAID' ? 'text-emerald-600' : 'text-slate-400'}`}>Итого к выплате</div>
                  <div className={`text-3xl font-black ${selectedData.status === 'PAID' ? 'text-emerald-700' : 'text-white'}`}>
                    {selectedData.totalPayout.toLocaleString('ru-RU')} ₽
                  </div>
                  {selectedData.status !== 'PAID' && (
                    <button onClick={() => markAsPaid(selectedData)} className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors">
                      Отметить как выплачено
                    </button>
                  )}
                  {selectedData.status === 'PAID' && (
                    <div className="mt-3 text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={14}/> ВЫПЛАЧЕНО
                    </div>
                  )}
                </div>
              </div>

              {/* Timesheet & Invoices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Timesheet */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Clock className="text-amber-500" /> Табель ({selectedData.totalHours} ч.)</h2>
                    
                    {/* Simulator buttons for today */}
                    <div className="flex gap-2">
                      <button onClick={() => handleClockIn(selectedData.doctor.id)} className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold rounded-lg transition-colors">
                        Приход
                      </button>
                      <button onClick={() => handleClockOut(selectedData.doctor.id)} className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-bold rounded-lg transition-colors">
                        Уход
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedData.timesheets.length === 0 ? (
                      <div className="text-sm text-slate-500 text-center py-4">Смен в этом месяце нет.</div>
                    ) : (
                      selectedData.timesheets.map((ts: any) => (
                        <div key={ts.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="font-semibold text-slate-700 text-sm">
                            {format(new Date(ts.date), 'dd MMMM', { locale: ru })}
                          </div>
                          <div className="flex gap-4 text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1 text-emerald-600">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              {ts.clockIn ? format(new Date(ts.clockIn), 'HH:mm') : '-'}
                            </span>
                            <span className="flex items-center gap-1 text-amber-600">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              {ts.clockOut ? format(new Date(ts.clockOut), 'HH:mm') : '-'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Services */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6"><CheckCircle className="text-blue-500" /> Оказанные услуги</h2>
                  
                  <div className="space-y-3 h-[400px] overflow-y-auto pr-2">
                    {selectedData.invoiceItems.length === 0 ? (
                      <div className="text-sm text-slate-500 text-center py-4">Оплаченных услуг в этом месяце нет.</div>
                    ) : (
                      selectedData.invoiceItems.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                          <div>
                            <div className="text-sm font-bold text-slate-800">{item.serviceName}</div>
                            <div className="text-xs text-slate-400 mt-1">Чек: {item.invoice?.invoiceNumber}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-slate-900">{item.amount.toLocaleString('ru-RU')} ₽</div>
                            <div className="text-xs font-bold text-blue-500">+{((item.amount * selectedData.doctor.commissionRate) / 100).toLocaleString('ru-RU')} ₽</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* Adjustment Modal */}
      {editingDoc && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Премии и Штрафы</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Премия (₽)</label>
                <input type="number" value={bonus} onChange={e => setBonus(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Штраф (₽)</label>
                <input type="number" value={penalty} onChange={e => setPenalty(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingDoc(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                Отмена
              </button>
              <button onClick={saveAdjustment} disabled={saving} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
