'use client'

import React from 'react'
import { Activity, Pill, AlertTriangle, ClipboardList, Plus, History } from 'lucide-react'

export default function PatientMedicalCard() {
  const [medicalData, setMedicalData] = React.useState({
    diagnoses: [
      { id: '1', name: 'Гипертоническая болезнь II ст.', date: '12.03.2026', status: 'ACTIVE' },
      { id: '2', name: 'Остеохондроз шейного отдела', date: '05.01.2026', status: 'CHRONIC' }
    ],
    medications: [
      { id: '1', name: 'Лизиноприл 10мг', dosage: '1 таб. утром', period: 'Длительно' },
      { id: '2', name: 'Магне B6', dosage: '1 таб. 3 раза в день', period: '1 месяц' }
    ],
    allergies: [
      { id: '1', name: 'Пенициллин', severity: 'HIGH' },
      { id: '2', name: 'Цитрусовые', severity: 'LOW' }
    ]
  })

  return (
    <div className="medical-card-container">
      <div className="medical-grid">
        {/* Diagnoses Section */}
        <div className="medical-section glass-card">
          <div className="section-header">
            <h4><Activity size={18} /> Диагнозы</h4>
            <button className="add-btn"><Plus size={16} /></button>
          </div>
          <div className="section-content">
            {medicalData.diagnoses.map(d => (
              <div key={d.id} className="medical-item">
                <div className="item-main">{d.name}</div>
                <div className="item-sub">Установлен: {d.date} • <span className={`status ${d.status.toLowerCase()}`}>{d.status}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Medications Section */}
        <div className="medical-section glass-card">
          <div className="section-header">
            <h4><Pill size={18} /> Препараты</h4>
            <button className="add-btn"><Plus size={16} /></button>
          </div>
          <div className="section-content">
            {medicalData.medications.map(m => (
              <div key={m.id} className="medical-item">
                <div className="item-main">{m.name}</div>
                <div className="item-sub">{m.dosage} • {m.period}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Allergies Section */}
        <div className="medical-section glass-card">
          <div className="section-header">
            <h4><AlertTriangle size={18} /> Аллергии</h4>
            <button className="add-btn"><Plus size={16} /></button>
          </div>
          <div className="section-content">
            {medicalData.allergies.map(a => (
              <div key={a.id} className="medical-item allergy">
                <div className="item-main">{a.name}</div>
                <div className="item-sub">Степень риска: <span className={`severity ${a.severity.toLowerCase()}`}>{a.severity}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* History Section */}
        <div className="medical-section glass-card full-width">
          <div className="section-header">
            <h4><History size={18} /> История изменений</h4>
          </div>
          <div className="section-content">
            <div className="history-timeline">
              <div className="history-event">
                <div className="event-date">15.05.2026</div>
                <div className="event-desc">Обновлен список препаратов. Добавлен Магне B6. (Др. Смирнова)</div>
              </div>
              <div className="history-event">
                <div className="event-date">12.03.2026</div>
                <div className="event-desc">Установлен основной диагноз: Гипертоническая болезнь II ст. (Др. Иванов)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .medical-card-container {
          padding: 1.5rem;
          height: 100%;
          overflow-y: auto;
        }

        .medical-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .medical-section {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .full-width {
          grid-column: span 2;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.75rem;
        }

        .section-header h4 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          color: var(--text-main);
          font-weight: 700;
        }

        .add-btn {
          background: #f1f5f9;
          border: none;
          color: var(--text-secondary);
          padding: 0.3rem;
          border-radius: 0.4rem;
          cursor: pointer;
        }

        .add-btn:hover {
          background: var(--primary);
          color: white;
        }

        .section-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .medical-item {
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 0.75rem;
          border: 1px solid #f1f5f9;
        }

        .item-main {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 0.2rem;
        }

        .item-sub {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .status { font-weight: 700; font-size: 0.7rem; }
        .status.active { color: #ef4444; }
        .status.chronic { color: #f59e0b; }

        .severity { font-weight: 700; font-size: 0.7rem; }
        .severity.high { color: #ef4444; }
        .severity.low { color: #10b981; }

        .history-timeline {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .history-event {
          display: flex;
          gap: 1.5rem;
          padding-left: 0.5rem;
          position: relative;
        }

        .history-event::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: -1rem;
          width: 2px;
          background: var(--border);
        }

        .history-event:last-child::before {
          bottom: 0;
        }

        .event-date {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-secondary);
          min-width: 80px;
        }

        .event-desc {
          font-size: 0.85rem;
          color: var(--text-main);
          line-height: 1.4;
        }
      `}</style>
    </div>
  )
}
