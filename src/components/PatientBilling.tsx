'use client'

import React from 'react'
import { CreditCard, Receipt, TrendingDown, TrendingUp, Plus, Download } from 'lucide-react'

interface Transaction {
  id: string
  date: string
  service: string
  amount: number
  status: 'PAID' | 'PENDING' | 'OVERDUE'
}

export default function PatientBilling() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([
    { id: '1', date: '15.05.2026', service: 'Первичный прием терапевта', amount: 2500, status: 'PAID' },
    { id: '2', date: '12.05.2026', service: 'УЗИ брюшной полости', amount: 3200, status: 'PAID' },
    { id: '3', date: '10.05.2026', service: 'Анализ крови (общий)', amount: 1500, status: 'PENDING' }
  ])

  const totalPaid = transactions.filter(t => t.status === 'PAID').reduce((acc, t) => acc + t.amount, 0)
  const balance = transactions.filter(t => t.status !== 'PAID').reduce((acc, t) => acc + t.amount, 0)

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
        <button className="btn-primary-small"><Plus size={16} /> Создать счет</button>
      </div>

      <div className="transactions-list glass-card">
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
                  <span className={`status-badge ${t.status.toLowerCase()}`}>
                    {t.status === 'PAID' ? 'Оплачено' : t.status === 'PENDING' ? 'Ожидает' : 'Просрочено'}
                  </span>
                </td>
                <td>
                  <button className="icon-btn"><Download size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
        }

        .icon-btn:hover {
          background: #f1f5f9;
          color: var(--primary);
        }
      `}</style>
    </div>
  )
}
