'use client'

import React from 'react'
import { Activity, Pill, AlertTriangle, ClipboardList, Plus, History, X } from 'lucide-react'

interface PatientMedicalCardProps {
  medical: {
    diagnoses: { id: string; name: string; date: string; status: string }[]
    medications: { id: string; name: string; dosage: string; period: string }[]
    allergies: { id: string; name: string; severity: string }[]
    history: { date: string; desc: string }[]
  }
  onUpdate: (updated: any) => void
}

export default function PatientMedicalCard({ medical, onUpdate }: PatientMedicalCardProps) {
  const [showDiagModal, setShowDiagModal] = React.useState(false)
  const [showMedModal, setShowMedModal] = React.useState(false)
  const [showAllergyModal, setShowAllergyModal] = React.useState(false)

  // Form states
  const [diagName, setDiagName] = React.useState('')
  const [diagStatus, setDiagStatus] = React.useState('ACTIVE')

  const [medName, setMedName] = React.useState('')
  const [medDosage, setMedDosage] = React.useState('')
  const [medPeriod, setMedPeriod] = React.useState('')

  const [allergyName, setAllergyName] = React.useState('')
  const [allergySeverity, setAllergySeverity] = React.useState('LOW')

  const handleAddDiagnosis = (e: React.FormEvent) => {
    e.preventDefault()
    if (!diagName.trim()) return

    const today = new Date().toLocaleDateString('ru-RU')
    const newDiag = {
      id: Date.now().toString(),
      name: diagName,
      date: today,
      status: diagStatus
    }

    const updated = {
      ...medical,
      diagnoses: [...(medical.diagnoses || []), newDiag],
      history: [
        {
          date: today,
          desc: `Установлен диагноз: ${diagName} (${diagStatus === 'ACTIVE' ? 'Активный' : 'Хронический'}). (Др. Смирнова)`
        },
        ...(medical.history || [])
      ]
    }

    onUpdate(updated)
    setDiagName('')
    setDiagStatus('ACTIVE')
    setShowDiagModal(false)
  }

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault()
    if (!medName.trim()) return

    const today = new Date().toLocaleDateString('ru-RU')
    const newMed = {
      id: Date.now().toString(),
      name: medName,
      dosage: medDosage || '1 таб.',
      period: medPeriod || 'Длительно'
    }

    const updated = {
      ...medical,
      medications: [...(medical.medications || []), newMed],
      history: [
        {
          date: today,
          desc: `Назначен препарат: ${medName} (${newMed.dosage}, ${newMed.period}). (Др. Смирнова)`
        },
        ...(medical.history || [])
      ]
    }

    onUpdate(updated)
    setMedName('')
    setMedDosage('')
    setMedPeriod('')
    setShowMedModal(false)
  }

  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault()
    if (!allergyName.trim()) return

    const today = new Date().toLocaleDateString('ru-RU')
    const newAllergy = {
      id: Date.now().toString(),
      name: allergyName,
      severity: allergySeverity
    }

    const updated = {
      ...medical,
      allergies: [...(medical.allergies || []), newAllergy],
      history: [
        {
          date: today,
          desc: `Выявлена аллергия: ${allergyName} (риск: ${allergySeverity === 'HIGH' ? 'Высокий' : 'Низкий'}). (Др. Смирнова)`
        },
        ...(medical.history || [])
      ]
    }

    onUpdate(updated)
    setAllergyName('')
    setAllergySeverity('LOW')
    setShowAllergyModal(false)
  }

  return (
    <div className="medical-card-container">
      <div className="medical-grid">
        {/* Diagnoses Section */}
        <div className="medical-section glass-card">
          <div className="section-header">
            <h4><Activity size={18} /> Диагнозы</h4>
            <button className="add-btn" onClick={() => setShowDiagModal(true)}><Plus size={16} /></button>
          </div>
          <div className="section-content">
            {medical.diagnoses && medical.diagnoses.length > 0 ? (
              medical.diagnoses.map(d => (
                <div key={d.id} className="medical-item">
                  <div className="item-main">{d.name}</div>
                  <div className="item-sub">Установлен: {d.date} • <span className={`status ${d.status.toLowerCase()}`}>{d.status === 'ACTIVE' ? 'АКТИВНЫЙ' : 'ХРОНИЧЕСКИЙ'}</span></div>
                </div>
              ))
            ) : (
              <p className="no-data">Диагнозы не установлены</p>
            )}
          </div>
        </div>

        {/* Medications Section */}
        <div className="medical-section glass-card">
          <div className="section-header">
            <h4><Pill size={18} /> Препараты</h4>
            <button className="add-btn" onClick={() => setShowMedModal(true)}><Plus size={16} /></button>
          </div>
          <div className="section-content">
            {medical.medications && medical.medications.length > 0 ? (
              medical.medications.map(m => (
                <div key={m.id} className="medical-item">
                  <div className="item-main">{m.name}</div>
                  <div className="item-sub">{m.dosage} • {m.period}</div>
                </div>
              ))
            ) : (
              <p className="no-data">Препараты не назначены</p>
            )}
          </div>
        </div>

        {/* Allergies Section */}
        <div className="medical-section glass-card">
          <div className="section-header">
            <h4><AlertTriangle size={18} /> Аллергии</h4>
            <button className="add-btn" onClick={() => setShowAllergyModal(true)}><Plus size={16} /></button>
          </div>
          <div className="section-content">
            {medical.allergies && medical.allergies.length > 0 ? (
              medical.allergies.map(a => (
                <div key={a.id} className="medical-item allergy">
                  <div className="item-main">{a.name}</div>
                  <div className="item-sub">Степень риска: <span className={`severity ${a.severity.toLowerCase()}`}>{a.severity === 'HIGH' ? 'ВЫСОКИЙ' : 'НИЗКИЙ'}</span></div>
                </div>
              ))
            ) : (
              <p className="no-data">Аллергии не выявлены</p>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className="medical-section glass-card full-width">
          <div className="section-header">
            <h4><History size={18} /> История изменений</h4>
          </div>
          <div className="section-content">
            {medical.history && medical.history.length > 0 ? (
              <div className="history-timeline">
                {medical.history.map((event, idx) => (
                  <div key={idx} className="history-event">
                    <div className="event-date">{event.date}</div>
                    <div className="event-desc">{event.desc}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">История изменений пуста</p>
            )}
          </div>
        </div>
      </div>

      {/* --- DIAGNOSIS MODAL --- */}
      {showDiagModal && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-content glass-card">
            <div className="sub-modal-header">
              <h3>Добавить диагноз</h3>
              <button className="sub-close-btn" onClick={() => setShowDiagModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddDiagnosis} className="sub-modal-form">
              <div className="sub-form-group">
                <label>Название диагноза</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Например, Сахарный диабет 2 типа"
                  value={diagName}
                  onChange={e => setDiagName(e.target.value)}
                />
              </div>
              <div className="sub-form-group">
                <label>Статус</label>
                <select value={diagStatus} onChange={e => setDiagStatus(e.target.value)}>
                  <option value="ACTIVE">Активный</option>
                  <option value="CHRONIC">Хронический</option>
                </select>
              </div>
              <div className="sub-modal-footer">
                <button type="button" className="sub-btn-sec" onClick={() => setShowDiagModal(false)}>Отмена</button>
                <button type="submit" className="sub-btn-prim">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MEDICATION MODAL --- */}
      {showMedModal && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-content glass-card">
            <div className="sub-modal-header">
              <h3>Назначить препарат</h3>
              <button className="sub-close-btn" onClick={() => setShowMedModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddMedication} className="sub-modal-form">
              <div className="sub-form-group">
                <label>Название лекарства</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Например, Ибупрофен 400мг"
                  value={medName}
                  onChange={e => setMedName(e.target.value)}
                />
              </div>
              <div className="sub-form-group">
                <label>Дозировка</label>
                <input 
                  type="text" 
                  placeholder="Например, 1 таб. после еды"
                  value={medDosage}
                  onChange={e => setMedDosage(e.target.value)}
                />
              </div>
              <div className="sub-form-group">
                <label>Период приема</label>
                <input 
                  type="text" 
                  placeholder="Например, 10 дней или Постоянно"
                  value={medPeriod}
                  onChange={e => setMedPeriod(e.target.value)}
                />
              </div>
              <div className="sub-modal-footer">
                <button type="button" className="sub-btn-sec" onClick={() => setShowMedModal(false)}>Отмена</button>
                <button type="submit" className="sub-btn-prim">Назначить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ALLERGY MODAL --- */}
      {showAllergyModal && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-content glass-card">
            <div className="sub-modal-header">
              <h3>Добавить аллергию</h3>
              <button className="sub-close-btn" onClick={() => setShowAllergyModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddAllergy} className="sub-modal-form">
              <div className="sub-form-group">
                <label>Аллерген</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Например, Аспирин"
                  value={allergyName}
                  onChange={e => setAllergyName(e.target.value)}
                />
              </div>
              <div className="sub-form-group">
                <label>Степень риска</label>
                <select value={allergySeverity} onChange={e => setAllergySeverity(e.target.value)}>
                  <option value="LOW">Низкий риск</option>
                  <option value="HIGH">Высокий риск</option>
                </select>
              </div>
              <div className="sub-modal-footer">
                <button type="button" className="sub-btn-sec" onClick={() => setShowAllergyModal(false)}>Отмена</button>
                <button type="submit" className="sub-btn-prim">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          transition: all 0.2s;
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

        .no-data {
          font-size: 0.85rem;
          color: var(--text-secondary);
          text-align: center;
          padding: 1rem;
          font-style: italic;
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
