'use client'

import React from 'react'
import { Microscope, TrendingUp, TrendingDown, AlertCircle, Download, FileText } from 'lucide-react'

interface LabResult {
  id: string
  name: string
  value: number
  unit: string
  reference: string
  status: 'NORMAL' | 'HIGH' | 'LOW'
}

export default function PatientLabs() {
  const [results, setResults] = React.useState<LabResult[]>([
    { id: '1', name: 'Глюкоза (кровь)', value: 5.4, unit: 'ммоль/л', reference: '3.3 - 5.5', status: 'NORMAL' },
    { id: '2', name: 'Холестерин общий', value: 6.2, unit: 'ммоль/л', reference: '3.1 - 5.2', status: 'HIGH' },
    { id: '3', name: 'Гемоглобин', value: 135, unit: 'г/л', reference: '130 - 160', status: 'NORMAL' },
    { id: '4', name: 'Железо', value: 9.1, unit: 'мкмоль/л', reference: '10.7 - 32.2', status: 'LOW' }
  ])

  return (
    <div className="labs-container">
      <div className="labs-header">
        <div className="header-info">
          <h3>Результаты лабораторных исследований</h3>
          <p>Последнее обновление: 15 мая 2026</p>
        </div>
        <button className="btn-primary-small"><FileText size={16} /> Полный отчет (PDF)</button>
      </div>

      <div className="results-list glass-card">
        <table className="labs-table">
          <thead>
            <tr>
              <th>Показатель</th>
              <th>Результат</th>
              <th>Ед. изм.</th>
              <th>Норма</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr key={r.id}>
                <td className="indicator-name">{r.name}</td>
                <td className={`value-cell ${r.status.toLowerCase()}`}>{r.value}</td>
                <td>{r.unit}</td>
                <td className="ref-cell">{r.reference}</td>
                <td>
                  <div className={`status-pill ${r.status.toLowerCase()}`}>
                    {r.status === 'HIGH' && <TrendingUp size={14} />}
                    {r.status === 'LOW' && <TrendingDown size={14} />}
                    {r.status === 'NORMAL' ? 'В норме' : r.status === 'HIGH' ? 'Выше' : 'Ниже'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lab-alerts">
        {results.some(r => r.status !== 'NORMAL') && (
          <div className="alert-card warning">
            <AlertCircle size={20} />
            <div>
              <strong>Внимание!</strong> Обнаружены отклонения от нормы в показателях липидного профиля и обмена железа.
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .labs-container {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .labs-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .header-info h3 {
          font-size: 1.1rem;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }

        .header-info p {
          font-size: 0.8rem;
          color: var(--text-secondary);
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

        .results-list {
          overflow: hidden;
          padding: 0;
        }

        .labs-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .labs-table th {
          padding: 1rem;
          background: #f8fafc;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-secondary);
          font-weight: 700;
          border-bottom: 1px solid var(--border);
        }

        .labs-table td {
          padding: 1rem;
          font-size: 0.85rem;
          color: var(--text-main);
          border-bottom: 1px solid #f1f5f9;
        }

        .indicator-name {
          font-weight: 600;
        }

        .value-cell {
          font-weight: 700;
          font-size: 1rem;
        }

        .value-cell.high { color: #ef4444; }
        .value-cell.low { color: #f59e0b; }

        .ref-cell {
          color: var(--text-secondary);
          font-family: monospace;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-pill.normal { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-pill.high { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .status-pill.low { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

        .lab-alerts {
          margin-top: 0.5rem;
        }

        .alert-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 1rem;
          font-size: 0.9rem;
        }

        .alert-card.warning {
          background: #fffbeb;
          border: 1px solid #fef3c7;
          color: #92400e;
        }
      `}</style>
    </div>
  )
}
