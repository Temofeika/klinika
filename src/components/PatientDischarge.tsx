'use client'

import React, { useEffect, useState } from 'react'
import { FileText, Save, Send, Eye, RefreshCw, Printer } from 'lucide-react'

interface Doctor {
  id: string
  firstName: string
  lastName: string
  position: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string | null
  notes?: string | null
  dateOfBirth?: string | Date | null
}

interface PatientDischargeProps {
  patient: Patient
  medical: any
  onUpdate: (updated: any) => Promise<void>
  doctorsList: Doctor[]
  doctorId?: string
}

export default function PatientDischarge({
  patient,
  medical,
  onUpdate,
  doctorsList,
  doctorId
}: PatientDischargeProps) {
  // Try to load existing discharge from medical records
  const existingDischarge = medical?.discharge || null

  const activeDoctorObj = doctorsList.find(d => d.id === doctorId)
  const defaultDoctorName = activeDoctorObj
    ? `${activeDoctorObj.firstName} ${activeDoctorObj.lastName} (${activeDoctorObj.position})`
    : ''

  // Form states
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [complaints, setComplaints] = useState('')
  const [tests, setTests] = useState('')
  const [treatment, setTreatment] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [attendingDoctorId, setAttendingDoctorId] = useState('')
  const [status, setStatus] = useState<'DRAFT' | 'COMPLETED'>('DRAFT')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Initialize fields
  useEffect(() => {
    if (existingDischarge) {
      setStartDate(existingDischarge.startDate || '')
      setEndDate(existingDischarge.endDate || '')
      setDiagnosis(existingDischarge.diagnosis || '')
      setComplaints(existingDischarge.complaints || '')
      setTests(existingDischarge.tests || '')
      setTreatment(existingDischarge.treatment || '')
      setRecommendations(existingDischarge.recommendations || '')
      setAttendingDoctorId(existingDischarge.attendingDoctorId || doctorId || '')
      setStatus(existingDischarge.status || 'DRAFT')
    } else {
      // Default dates
      const today = new Date().toISOString().substring(0, 10)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
      setStartDate(weekAgo)
      setEndDate(today)

      // Prefill Diagnosis from active diagnoses
      const activeDiagnoses = medical?.diagnoses
        ?.filter((d: any) => d.status === 'ACTIVE' || d.status === 'CHRONIC')
        ?.map((d: any) => d.name)
        ?.join(', ') || ''
      setDiagnosis(activeDiagnoses)

      // Prefill Complaints from patient notes
      setComplaints(patient.notes || '')

      // Prefill Tests from lab results
      const testsSummary = medical?.labs
        ?.map((l: any) => `${l.name}: ${l.value} ${l.unit} (Норма: ${l.reference})`)
        ?.join('\n') || ''
      setTests(testsSummary)

      // Prefill Treatment from medications
      const medSummary = medical?.medications
        ?.map((m: any) => `${m.name} — ${m.dosage} (${m.period})`)
        ?.join('\n') || ''
      setTreatment(medSummary)

      // Pre-select current doctor
      setAttendingDoctorId(doctorId || '')
      setStatus('DRAFT')
      setRecommendations('')
    }
  }, [existingDischarge, patient, medical, doctorId])

  // Reset fields to smart defaults
  const handlePrefillAll = () => {
    const activeDiagnoses = medical?.diagnoses
      ?.filter((d: any) => d.status === 'ACTIVE' || d.status === 'CHRONIC')
      ?.map((d: any) => d.name)
      ?.join(', ') || ''
    setDiagnosis(activeDiagnoses)

    setComplaints(patient.notes || '')

    const testsSummary = medical?.labs
      ?.map((l: any) => `${l.name}: ${l.value} ${l.unit} (Норма: ${l.reference})`)
      ?.join('\n') || ''
    setTests(testsSummary)

    const medSummary = medical?.medications
      ?.map((m: any) => `${m.name} — ${m.dosage} (${m.period})`)
      ?.join('\n') || ''
    setTreatment(medSummary)

    setMessage({ type: 'success', text: 'Поля формы автоматически перезаполнены данными из медкарты!' })
    setTimeout(() => setMessage(null), 3000)
  }

  // Handle saving discharge form
  const handleSave = async (newStatus: 'DRAFT' | 'COMPLETED') => {
    setSaving(true)
    setMessage(null)

    const selectedDoc = doctorsList.find(d => d.id === attendingDoctorId)
    const attendingDoctorName = selectedDoc
      ? `${selectedDoc.firstName} ${selectedDoc.lastName} (${selectedDoc.position})`
      : defaultDoctorName

    const dischargeData = {
      startDate,
      endDate,
      diagnosis,
      complaints,
      tests,
      treatment,
      recommendations,
      attendingDoctorId,
      attendingDoctorName,
      status: newStatus,
      updatedAt: new Date().toISOString()
    }

    try {
      // 1. Save locally in client database via our dedicated discharge API
      const res = await fetch('/api/patient/discharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          discharge: dischargeData
        })
      })

      const data = await res.json()

      if (res.ok) {
        setStatus(newStatus)
        
        // Update parent state
        const updatedMedical = {
          ...medical,
          discharge: dischargeData,
          history: [
            {
              date: new Date().toLocaleDateString('ru-RU'),
              desc: `${newStatus === 'COMPLETED' ? 'Оформлена и отправлена' : 'Сохранена как черновик'} выписка пациента. Лечащий врач: ${attendingDoctorName}.`
            },
            ...(medical.history || [])
          ]
        }
        await onUpdate(updatedMedical)

        if (newStatus === 'COMPLETED') {
          setMessage({
            type: 'success',
            text: 'Выписка успешно оформлена, сохранена и отправлена пациенту в Telegram-бот!'
          })
        } else {
          setMessage({
            type: 'success',
            text: 'Черновик выписки успешно сохранен!'
          })
        }
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Не удалось сохранить выписку.'
        })
      }
    } catch (err: any) {
      console.error('Error saving discharge:', err)
      setMessage({ type: 'error', text: 'Сетевая ошибка при сохранении выписки.' })
    } finally {
      setSaving(false)
    }
  }

  // Open discharge webpage in a new tab
  const handleOpenPrintPreview = () => {
    window.open(`/discharge/${patient.id}`, '_blank')
  }

  return (
    <div className="discharge-form-container">
      <div className="discharge-form-header">
        <div className="header-info">
          <h3>Выписка из медицинской карты</h3>
          <span className={`status-badge ${status.toLowerCase()}`}>
            {status === 'COMPLETED' ? 'ГОТОВА И ОТПРАВЛЕНА' : 'ЧЕРНОВИК'}
          </span>
        </div>
        <div className="header-actions">
          <button 
            type="button" 
            className="btn-sec-small" 
            onClick={handlePrefillAll} 
            title="Заполнить поля актуальными диагнозами, лекарствами и тестами из карты"
          >
            <RefreshCw size={14} /> Подгрузить данные
          </button>
          
          {status === 'COMPLETED' && (
            <button 
              type="button" 
              className="btn-sec-small print-btn" 
              onClick={handleOpenPrintPreview}
            >
              <Printer size={14} /> Печатный бланк
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`form-alert ${message.type}`}>
          {message.text}
        </div>
      )}

      <form className="discharge-fields-grid" onSubmit={e => e.preventDefault()}>
        {/* Treatment Period & Doctor */}
        <div className="fields-row-3">
          <div className="form-field">
            <label>Дата начала лечения</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              required
            />
          </div>
          <div className="form-field">
            <label>Дата окончания (выписки)</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              required
            />
          </div>
          <div className="form-field">
            <label>Лечащий врач</label>
            <select 
              value={attendingDoctorId} 
              onChange={e => setAttendingDoctorId(e.target.value)}
              required
            >
              <option value="">-- Выберите врача --</option>
              {doctorsList.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.firstName} {doc.lastName} ({doc.position})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="form-field full-width">
          <label>Основной клинический диагноз</label>
          <input 
            type="text" 
            value={diagnosis} 
            onChange={e => setDiagnosis(e.target.value)} 
            placeholder="Например, Гипертоническая болезнь II стадии, контролируемая..."
            required
          />
        </div>

        {/* Complaints and Anamnesis */}
        <div className="form-field full-width">
          <label>Жалобы и анамнез заболевания</label>
          <textarea 
            rows={3}
            value={complaints} 
            onChange={e => setComplaints(e.target.value)} 
            placeholder="Краткое описание жалоб пациента при поступлении и история заболевания..."
          />
        </div>

        {/* Diagnostic tests and Research */}
        <div className="form-field full-width">
          <label>Данные лабораторных и инструментальных исследований</label>
          <textarea 
            rows={4}
            value={tests} 
            onChange={e => setTests(e.target.value)} 
            placeholder="Результаты анализов крови, ЭКГ, УЗИ и других обследований..."
          />
        </div>

        {/* Treatment procedures / Meds */}
        <div className="form-field full-width">
          <label>Проведенное лечение</label>
          <textarea 
            rows={4}
            value={treatment} 
            onChange={e => setTreatment(e.target.value)} 
            placeholder="Какая терапия проводилась, лекарства, процедуры..."
          />
        </div>

        {/* Recommendations */}
        <div className="form-field full-width">
          <label>Рекомендации по дальнейшему лечению, диете и режиму</label>
          <textarea 
            rows={4}
            value={recommendations} 
            onChange={e => setRecommendations(e.target.value)} 
            placeholder="Режим, назначенная поддерживающая терапия, лекарственные препараты, дата повторного контроля..."
            required
          />
        </div>

        {/* Action Buttons Footer */}
        <div className="form-actions-footer">
          <button 
            type="button" 
            className="sub-btn-sec"
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
          >
            <Save size={16} /> Сохранить черновик
          </button>
          
          <button 
            type="button" 
            className="sub-btn-prim completed-action"
            onClick={() => handleSave('COMPLETED')}
            disabled={saving}
          >
            <Send size={16} /> Завершить и отправить пациенту
          </button>
        </div>
      </form>

      <style jsx>{`
        .discharge-form-container {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          height: 100%;
          overflow-y: auto;
        }

        .discharge-form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.75rem;
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .discharge-form-header h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-main);
          margin: 0;
        }

        .status-badge {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.25rem 0.6rem;
          border-radius: 2rem;
          letter-spacing: 0.05em;
        }

        .status-badge.draft {
          background: #f1f5f9;
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .status-badge.completed {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-sec-small {
          background: white;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          padding: 0.4rem 0.8rem;
          border-radius: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          transition: all 0.2s;
        }

        .btn-sec-small:hover {
          background: #f8fafc;
          color: var(--primary);
          border-color: var(--primary);
        }

        .btn-sec-small.print-btn {
          background: #f0f9ff;
          color: #0369a1;
          border-color: #bae6fd;
        }

        .btn-sec-small.print-btn:hover {
          background: #e0f2fe;
          color: #0284c7;
        }

        .form-alert {
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .form-alert.success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .form-alert.error {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .discharge-fields-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .fields-row-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1.2fr;
          gap: 1rem;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-field.full-width {
          width: 100%;
        }

        .form-field label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .form-field input, .form-field select, .form-field textarea {
          padding: 0.6rem 0.8rem;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          outline: none;
          font-size: 0.9rem;
          background: #f8fafc;
          transition: all 0.2s;
        }

        .form-field input:focus, .form-field select:focus, .form-field textarea:focus {
          border-color: var(--primary);
          background: white;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }

        .form-field textarea {
          font-family: inherit;
          resize: vertical;
          line-height: 1.5;
        }

        .form-actions-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1rem;
          border-top: 1px solid var(--border);
          padding-top: 1rem;
        }

        .sub-btn-sec {
          padding: 0.6rem 1.2rem;
          background: #f1f5f9;
          border: none;
          color: var(--text-secondary);
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.2s;
        }

        .sub-btn-sec:hover {
          background: #e2e8f0;
          color: var(--text-main);
        }

        .sub-btn-prim {
          padding: 0.6rem 1.2rem;
          background: var(--primary);
          border: none;
          color: white;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.2s;
        }

        .sub-btn-prim:hover {
          background: #1d4ed8;
          box-shadow: 0 4px 6px -1px rgba(29, 78, 216, 0.2);
        }

        .sub-btn-prim.completed-action {
          background: #16a34a;
        }

        .sub-btn-prim.completed-action:hover {
          background: #15803d;
          box-shadow: 0 4px 6px -1px rgba(21, 128, 61, 0.2);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
