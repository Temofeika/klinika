'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, DollarSign, Plus, CheckCircle2, FileText, ShoppingCart, User, Receipt } from 'lucide-react'

interface Service {
  id: string
  code: string
  name: string
  price: number
  category: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  phone: string
  balance: number
}

interface InvoiceItem {
  serviceName: string
  price: number
  quantity: number
  amount: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  totalAmount: number
  status: string
  createdAt: string
  patient: Patient
  items: InvoiceItem[]
  payments: { amount: number; paymentMethod: string; paidAt: string }[]
}

export default function BillingDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Invoice creation state
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [cartItems, setCartItems] = useState<{ serviceId: string; serviceName: string; price: number; quantity: number }[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Payment Modal
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('CARD')

  useEffect(() => {
    fetchInvoices()
    fetchServices()
    fetchPatients()
  }, [])

  const fetchInvoices = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/invoices')
      const data = await res.json()
      if (Array.isArray(data)) setInvoices(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
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
      if (Array.isArray(data)) setPatients(data)
    } catch (e) {}
  }

  const handleAddToCart = (service: Service) => {
    const existing = cartItems.find(i => i.serviceId === service.id)
    if (existing) {
      setCartItems(cartItems.map(i => i.serviceId === service.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setCartItems([...cartItems, { serviceId: service.id, serviceName: service.name, price: service.price, quantity: 1 }])
    }
  }

  const handleRemoveFromCart = (serviceId: string) => {
    setCartItems(cartItems.filter(i => i.serviceId !== serviceId))
  }

  const handleCreateInvoice = async () => {
    if (!selectedPatientId || cartItems.length === 0) return

    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          items: cartItems
        })
      })

      setIsModalOpen(false)
      setCartItems([])
      setSelectedPatientId('')
      fetchInvoices()
    } catch (e) {
      console.error(e)
    }
  }

  const handlePayInvoice = async () => {
    if (!payingInvoice) return

    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PAYMENT',
          invoiceId: payingInvoice.id,
          amount: payingInvoice.totalAmount,
          paymentMethod
        })
      })

      setPayingInvoice(null)
      fetchInvoices()
    } catch (e) {
      console.error(e)
    }
  }

  const totalRevenue = invoices
    .filter(i => i.status === 'PAID')
    .reduce((sum, i) => sum + i.totalAmount, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Выручка кассы (оплачено)</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalRevenue.toLocaleString()} ₽</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Всего счетов</p>
            <h3 className="text-2xl font-bold text-slate-900">{invoices.length}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Быстрое действие</p>
            <p className="text-xs text-slate-400">Сформировать акт оказанных услуг</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Выписать счет
          </button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-600" />
          Реестр счетов и чеков
        </h3>

        {isLoading ? (
          <p className="text-slate-400 text-sm text-center py-10">Загрузка счетов...</p>
        ) : invoices.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-10">Счета отсутствуют</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
                <tr>
                  <th className="p-3">№ Счета</th>
                  <th className="p-3">Пациент</th>
                  <th className="p-3">Состав услуг</th>
                  <th className="p-3">Сумма</th>
                  <th className="p-3">Статус</th>
                  <th className="p-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="p-3">
                      <p className="font-medium text-slate-900">{inv.patient.lastName} {inv.patient.firstName}</p>
                      <p className="text-xs text-slate-400">{inv.patient.phone}</p>
                    </td>
                    <td className="p-3 text-xs text-slate-600">
                      {inv.items.map(item => item.serviceName).join(', ')}
                    </td>
                    <td className="p-3 font-bold text-slate-900">{inv.totalAmount.toLocaleString()} ₽</td>
                    <td className="p-3">
                      {inv.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Оплачен
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                          К оплате
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {inv.status !== 'PAID' ? (
                        <button
                          onClick={() => setPayingInvoice(inv)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow transition"
                        >
                          Принять оплату
                        </button>
                      ) : (
                        <button
                          onClick={() => window.print()}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                        >
                          Чек PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
            <h3 className="font-bold text-lg text-slate-900 border-b border-slate-100 pb-3">
              Выписать счет на оплату
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Пациент</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="">-- Выберите пациента --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.lastName} {p.firstName} ({p.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Добавить услуги из каталога</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-slate-200 p-2 rounded-xl">
                  {services.map(s => (
                    <div key={s.id} className="p-2 border border-slate-100 bg-slate-50 rounded-lg flex items-center justify-between">
                      <div className="truncate pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{s.name}</p>
                        <p className="text-[11px] text-amber-600 font-semibold">{s.price} ₽</p>
                      </div>
                      <button
                        onClick={() => handleAddToCart(s)}
                        className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold transition"
                      >
                        + Добавить
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Table */}
              {cartItems.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/70 space-y-2">
                  <h4 className="font-bold text-xs uppercase text-slate-600">Выбранные услуги</h4>
                  {cartItems.map(item => (
                    <div key={item.serviceId} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200">
                      <span>{item.serviceName} (x{item.quantity})</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">{item.price * item.quantity} ₽</span>
                        <button onClick={() => handleRemoveFromCart(item.serviceId)} className="text-rose-600 font-bold hover:underline">✕</button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                    <span>Итого к оплате:</span>
                    <span>{cartItems.reduce((s, i) => s + (i.price * i.quantity), 0)} ₽</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateInvoice}
                  disabled={!selectedPatientId || cartItems.length === 0}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md shadow-amber-500/20 transition"
                >
                  Сформировать счет
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Принять оплату по счету</h3>
            <p className="text-xs text-slate-500">Счет №: <span className="font-mono font-bold text-slate-800">{payingInvoice.invoiceNumber}</span></p>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
              <span className="text-xs text-amber-800 font-semibold block">Сумма к оплате</span>
              <span className="text-3xl font-extrabold text-amber-900">{payingInvoice.totalAmount.toLocaleString()} ₽</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Способ оплаты</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none"
              >
                <option value="CARD">Банковская карта (Терминал)</option>
                <option value="CASH">Наличные средства</option>
                <option value="DEPOSIT">Депозитный счет пациента</option>
                <option value="INSURANCE">Страховая компания (ДМС/ОМС)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setPayingInvoice(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={handlePayInvoice}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-500/20 transition"
              >
                Провести платеж
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
