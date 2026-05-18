'use client'

import React from 'react'
import { CreditCard, Receipt, TrendingDown, TrendingUp, Plus, Download, X } from 'lucide-react'

interface Transaction {
  id: string
  date: string
  service: string
  amount: number
  status: 'PAID' | 'PENDING' | 'OVERDUE'
}

interface PatientBillingProps {
  medical: {
    billing: Transaction[]
    history: { date: string; desc: string }[]
  }
  onUpdate: (updated: any) => void
}

export default function PatientBilling({ medical, onUpdate }: PatientBillingProps) {
  const [showModal, setShowModal] = React.useState(false)
  
  // Form states
  const [billService, setBillService] = React.useState('')
  const [billAmount, setBillAmount] = React.useState('')
  const [billStatus, setBillStatus] = React.useState<'PAID' | 'PENDING'>('PENDING')

  const transactions = medical.billing || []

  const totalPaid = transactions.filter(t => t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0)
  const balance = transactions.filter(t => t.status !== 'PAID').reduce((acc, t) => acc + t.amount, 0)

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseFloat(billAmount)
    if (!billService.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return

    const today = new Date().toLocaleDateString('ru-RU')
    const newInvoice: Transaction = {
      id: Date.now().toString(),
      date: today,
      service: billService,
      amount: parsedAmount,
      status: billStatus as any
    }

    const updated = {
      ...medical,
      billing: [...transactions, newInvoice],
      history: [
        {
          date: today,
          desc: `Выписан счет: ${billService} на сумму ${parsedAmount.toLocaleString()} ₽ (${billStatus === 'PAID' ? 'Оплачен' : 'Ожидает оплаты'}).`
        },
        ...(medical.history || [])
      ]
    }

    onUpdate(updated)
    setBillService('')
    setBillAmount('')
    setBillStatus('PENDING')
    setShowModal(false)
  }

  const handleTogglePaymentStatus = (txId: string) => {
    const today = new Date().toLocaleDateString('ru-RU')
    const updatedBilling = transactions.map(t => {
      if (t.id === txId) {
        const nextStatus = t.status === 'PAID' ? 'PENDING' : 'PAID'
        return { ...t, status: nextStatus as any }
      }
      return t
    })

    const targetTx = transactions.find(t => t.id === txId)
    const logDesc = targetTx
      ? `Статус счета за "${targetTx.service}" (${targetTx.amount} ₽) изменен на ${targetTx.status === 'PAID' ? 'Ожидает оплаты' : 'Оплачен'}.`
      : 'Статус счета изменен.'

    const updated = {
      ...medical,
      billing: updatedBilling,
      history: [
        {
          date: today,
          desc: logDesc
        },
        ...(medical.history || [])
      ]
    }

    onUpdate(updated)
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
            <div className="summary-label">Текущий долг</div>
            <div className="summary-value">{balance.toLocaleString()} ₽</div>
          </div>
        </div>
      </div>

      <div className="transactions-header">
        <h3>История транзакций</h3>
        <button className="btn-primary-small" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Создать счет
        </button>
      </div>

      <div className="transactions-list glass-card">
        {transactions.length > 0 ? (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Услуга</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td className="service-cell">{t.service}</td>
                  <td className="amount-cell">{t.amount.toLocaleString()} ₽</td>
                  <td>
                    <span 
                      className={`status-badge ${t.status.toLowerCase()}`}
                      onClick={() => handleTogglePaymentStatus(t.id)}
                      style={{ cursor: 'pointer' }}
                      title="Нажмите, чтобы изменить статус оплаты"
                    >
                      {t.status === 'PAID' ? 'Оплачено' : t.status === 'PENDING' ? 'Ожидает' : 'Просрочено'}
                    </span>
                  </td>
                  <td>
                    <button className="icon-btn" onClick={() => handleTogglePaymentStatus(t.id)} title="Изменить статус оплаты">
                      <CreditCard size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-data">Транзакции отсутствуют</p>
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
                  <option value="PENDING">Ожидает оплаты</option>
                  <option value="PAID">Оплачено сразу</option>
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
        .status-badge.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .status-badge.overdue { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .icon-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.4rem;
          border-radius: 0.4rem;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: #f1f5f9;
          color: var(--primary);
        }

        .no-data {
          font-size: 0.85rem;
          color: var(--text-secondary);
          text-align: center;
          padding: 2rem;
          font-style: italic;
        }

        /* --- SUB-MODAL STYLING --- */
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
