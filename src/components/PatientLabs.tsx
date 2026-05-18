'use client'

import React from 'react'
import { Microscope, TrendingUp, TrendingDown, AlertCircle, Plus, X } from 'lucide-react'

interface LabResult {
  id: string
  name: string
  value: number
  unit: string
  reference: string
  status: 'NORMAL' | 'HIGH' | 'LOW'
}

interface PatientLabsProps {
  medical: {
    labs: LabResult[]
    history: { date: string; desc: string }[]
  }
  onUpdate: (updated: any) => void
}

export default function PatientLabs({ medical, onUpdate }: PatientLabsProps) {
  const [showModal, setShowModal] = React.useState(false)

  // Form states
  const [labName, setLabName] = React.useState('')
  const [labValue, setLabValue] = React.useState('')
  const [labUnit, setLabUnit] = React.useState('ммоль/л')
  const [labReference, setLabReference] = React.useState('')
  const [labStatus, setLabStatus] = React.useState<'NORMAL' | 'HIGH' | 'LOW'>('NORMAL')

  const results = medical.labs || []

  const handleAddLabResult = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedValue = parseFloat(labValue)
    if (!labName.trim() || isNaN(parsedValue)) return

    const today = new Date().toLocaleDateString('ru-RU')
    const newLab: LabResult = {
      id: Date.now().toString(),
      name: labName,
      value: parsedValue,
      unit: labUnit,
      reference: labReference || '—',
      status: labStatus
    }

    const statusText = labStatus === 'HIGH' ? 'Выше нормы' : labStatus === 'LOW' ? 'Ниже нормы' : 'В норме'
    const updated = {
      ...medical,
      labs: [...results, newLab],
      history: [
        {
          date: today,
          desc: `Зарегистрирован анализ: ${labName} — ${parsedValue} ${labUnit} (${statusText}, норма: ${newLab.reference}).`
        },
        ...(medical.history || [])
      ]
    }

    onUpdate(updated)
    setLabName('')
    setLabValue('')
    setLabReference('')
    setLabStatus('NORMAL')
    setShowModal(false)
  }

  const hasAlerts = results.some(r => r.status !== 'NORMAL')

  return (
    <div className="labs-container">
      <div className="labs-header">
        <div className="header-info">
          <h3>Результаты лабораторных исследований</h3>
          <p>Последнее обновление: {results.length > 0 ? 'Сегодня' : 'Данные отсутствуют'}</p>
        </div>
        <button className="btn-primary-small" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Добавить анализ
        </button>
      </div>

      <div className="results-list glass-card">
        {results.length > 0 ? (
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
        ) : (
          <p className="no-data">Результаты анализов отсутствуют</p>
        )}
      </div>

      <div className="lab-alerts">
        {hasAlerts && (
          <div className="alert-card warning">
            <AlertCircle size={20} />
            <div>
              <strong>Внимание!</strong> Обнаружены отклонения от нормы в показателях. Рекомендуется консультация лечащего врача.
            </div>
          </div>
        )}
      </div>

      {/* --- ADD LAB MODAL --- */}
      {showModal && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-content glass-card">
            <div className="sub-modal-header">
              <h3>Добавить результат анализа</h3>
              <button className="sub-close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddLabResult} className="sub-modal-form">
              <div className="sub-form-group">
                <label>Показатель</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Например, Общий холестерин"
                  value={labName}
                  onChange={e => setLabName(e.target.value)}
                />
              </div>
              <div className="form-grid">
                <div className="sub-form-group">
                  <label>Результат</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required 
                    placeholder="Например, 5.4"
                    value={labValue}
                    onChange={e => setLabValue(e.target.value)}
                  />
                </div>
                <div className="sub-form-group">
                  <label>Единица измерения</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="ммоль/л, г/л и т.д."
                    value={labUnit}
                    onChange={e => setLabUnit(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-grid">
                <div className="sub-form-group">
                  <label>Норма (Референтный интервал)</label>
                  <input 
                    type="text" 
                    placeholder="Например, 3.1 - 5.2"
                    value={labReference}
                    onChange={e => setLabReference(e.target.value)}
                  />
                </div>
                <div className="sub-form-group">
                  <label>Соответствие норме</label>
                  <select value={labStatus} onChange={e => setLabStatus(e.target.value as any)}>
                    <option value="NORMAL">В норме (Normal)</option>
                    <option value="HIGH">Выше нормы (High)</option>
                    <option value="LOW">Ниже нормы (Low)</option>
                  </select>
                </div>
              </div>
              <div className="sub-modal-footer">
                <button type="button" className="sub-btn-sec" onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className="sub-btn-prim">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          width: 450px;
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

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
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
