'use client'

import React, { useState, useEffect } from 'react'
import { CreditCard, Receipt, TrendingDown, TrendingUp, Plus, Download, X } from 'lucide-react'

interface InvoiceItem {
  id: string
  serviceName: string
  price: number
  quantity: number
  amount: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  totalAmount: number
  status: 'UNPAID' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED'
  createdAt: string
  items: InvoiceItem[]
}

interface PatientBillingProps {
  patientId: string
}

export default function PatientBilling({ patientId }: PatientBillingProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  
  // Form states
  const [billService, setBillService] = useState('')
  const [billAmount, setBillAmount] = useState('')
  const [billStatus, setBillStatus] = useState<'UNPAID' | 'PAID'>('UNPAID')

  useEffect(() => {
    fetchInvoices()
  }, [patientId])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/invoices?patientId=${patientId}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setInvoices(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((acc, i) => acc + i.totalAmount, 0)
  const balance = invoices.filter(i => i.status !== 'PAID').reduce((acc, i) => acc + i.totalAmount, 0)

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseFloat(billAmount)
    if (!billService.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          items: [{ serviceName: billService, price: parsedAmount, quantity: 1 }]
        })
      })

      if (res.ok) {
        const newInvoice = await res.json()
        
        // If it was marked as paid immediately, process payment
        if (billStatus === 'PAID') {
          await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'PAYMENT',
              invoiceId: newInvoice.id,
              amount: parsedAmount,
              paymentMethod: 'CASH'
            })
          })
        }

        alert(billStatus === 'PAID' ? 'Счет создан и оплачен!' : 'Счет создан и отправлен пациенту в Telegram!')
        setShowModal(false)
        setBillService('')
        setBillAmount('')
        setBillStatus('UNPAID')
        fetchInvoices()
      } else {
        alert('Ошибка при создании счета')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handlePayInvoice = async (invoiceId: string, amount: number) => {
    if (!window.confirm('Подтвердить оплату счета?')) return

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PAYMENT',
          invoiceId,
          amount,
          paymentMethod: 'CASH'
        })
      })
      if (res.ok) {
        alert('Счет успешно оплачен. Пациент получил квитанцию в Telegram.')
        fetchInvoices()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="billing-container">
      <div className="billing-summary">
        <div className="summary-card glass-card">
          <div className="summary-icon paid"><TrendingUp size={20} /></div>
          <div className="summary-info">
            <div className="summary-label">Оплачено всего</div>
            <div className="summary-value">{totalPaid.toLocaleString()} ₽</div>
          </div>
        </div>
        <div className="summary-card glass-card">
          <div className="summary-icon debt"><TrendingDown size={20} /></div>
          <div className="summary-info">
            <div className="summary-label">Текущий долг (к оплате)</div>
            <div className="summary-value">{balance.toLocaleString()} ₽</div>
          </div>
        </div>
      </div>

      <div className="transactions-header">
        <h3>Выставленные счета (Invoices)</h3>
        <button className="btn-primary-small" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Создать счет
        </button>
      </div>

      <div className="transactions-list glass-card">
        {loading ? (
          <p className="text-center p-6 text-slate-400 text-sm">Загрузка счетов...</p>
        ) : invoices.length > 0 ? (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>№ Счета</th>
                <th>Услуги</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Оплата</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td>{new Date(inv.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td className="font-mono text-xs text-slate-500">{inv.invoiceNumber}</td>
                  <td className="service-cell">
                    {inv.items.map((i, idx) => (
                      <div key={idx}>{i.serviceName}</div>
                    ))}
                  </td>
                  <td className="amount-cell">{inv.totalAmount.toLocaleString()} ₽</td>
                  <td>
                    <span className={`status-badge ${inv.status.toLowerCase()}`}>
                      {inv.status === 'PAID' ? 'Оплачено' : inv.status === 'UNPAID' ? 'Ожидает' : inv.status}
                    </span>
                  </td>
                  <td>
                    {inv.status !== 'PAID' ? (
                      <button 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold text-xs rounded-lg transition"
                        onClick={() => handlePayInvoice(inv.id, inv.totalAmount)}
                      >
                        <CreditCard size={14} /> Оплатить
                      </button>
                    ) : (
                      <span className="text-emerald-500 font-bold text-xs">✓ Зачислено</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data">Счета отсутствуют</p>
        )}
      </div>

      {/* --- CREATE INVOICE MODAL --- */}
      {showModal && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-content glass-card">
            <div className="sub-modal-header">
              <h3>Выписать новый счет</h3>
              <button className="sub-close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateInvoice} className="sub-modal-form">
              <div className="sub-form-group">
                <label>Медицинская услуга</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Например, Консультация специалиста"
                  value={billService}
                  onChange={e => setBillService(e.target.value)}
                />
              </div>
              <div className="sub-form-group">
                <label>Стоимость (руб.)</label>
                <input 
                  type="number" 
                  required 
                  placeholder="Например, 1500"
                  value={billAmount}
                  onChange={e => setBillAmount(e.target.value)}
                />
              </div>
              <div className="sub-form-group">
                <label>Статус</label>
                <select value={billStatus} onChange={e => setBillStatus(e.target.value as any)}>
                  <option value="UNPAID">Ожидает оплаты (выставить счет)</option>
                  <option value="PAID">Сразу оплачено (квитанция)</option>
                </select>
              </div>
              <div className="sub-modal-footer">
                <button type="button" className="sub-btn-sec" onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className="sub-btn-prim">Создать счет</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .billing-container {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .billing-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .summary-card {
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .summary-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-icon.paid { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .summary-icon.debt { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .summary-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .summary-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .transactions-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .transactions-header h3 {
          font-size: 1.1rem;
          color: var(--text-main);
          font-weight: 700;
        }

        .btn-primary-small {
          padding: 0.5rem 1rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .transactions-list {
          overflow: hidden;
          padding: 0;
        }

        .transactions-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .transactions-table th {
          padding: 1rem;
          background: #f8fafc;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-secondary);
          font-weight: 700;
          border-bottom: 1px solid var(--border);
        }

        .transactions-table td {
          padding: 1rem;
          font-size: 0.85rem;
          color: var(--text-main);
          border-bottom: 1px solid #f1f5f9;
        }

        .service-cell {
          font-weight: 600;
        }

        .amount-cell {
          font-weight: 700;
        }

        .status-badge {
          font-size: 0.7rem;
          padding: 0.2rem 0.6rem;
          border-radius: 9999px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .status-badge.paid { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-badge.unpaid { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

        .no-data {
          font-size: 0.85rem;
          color: var(--text-secondary);
          text-align: center;
          padding: 2rem;
          font-style: italic;
        }

        .sub-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease-out;
        }

        .sub-modal-content {
          width: 400px;
          padding: 1.5rem;
          background: white;
          border-radius: 1.25rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .sub-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
        }

        .sub-modal-header h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .sub-close-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.4rem;
        }

        .sub-close-btn:hover {
          background: #f1f5f9;
        }

        .sub-modal-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .sub-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .sub-form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .sub-form-group input, .sub-form-group select {
          padding: 0.6rem 0.8rem;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          outline: none;
          font-size: 0.9rem;
        }

        .sub-form-group input:focus, .sub-form-group select:focus {
          border-color: var(--primary);
        }

        .sub-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .sub-btn-sec {
          padding: 0.5rem 1rem;
          background: #f1f5f9;
          border: none;
          color: var(--text-secondary);
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }

        .sub-btn-prim {
          padding: 0.5rem 1rem;
          background: var(--primary);
          border: none;
          color: white;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }

        .sub-btn-prim:hover {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  )
}
