'use client'

import React from 'react'
import { Calendar, Clock, MapPin, MoreVertical, Plus, CheckCircle2, Bell, Send, X, User } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Appointment {
  id: string
  date: string | Date
  time: string
  doctor: string
  service: string
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED'
}

interface PatientAppointmentsProps {
  medical: {
    appointments: Appointment[]
    history: { date: string; desc: string }[]
  }
  onUpdate: (updated: any) => void
  onSendReminder: (app: any) => void
}

export default function PatientAppointments({ medical, onUpdate, onSendReminder }: PatientAppointmentsProps) {
  const [showModal, setShowModal] = React.useState(false)
  
  // Form states
  const [appDate, setAppDate] = React.useState('')
  const [appTime, setAppTime] = React.useState('')
  const [appDoctor, setAppDoctor] = React.useState('Др. Смирнова')
  const [appService, setAppService] = React.useState('')

  const appointments = medical.appointments || []

  const handleScheduleAppointment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!appDate || !appTime || !appService.trim()) return

    const today = new Date().toLocaleDateString('ru-RU')
    const newApp: Appointment = {
      id: Date.now().toString(),
      date: appDate,
      time: appTime,
      doctor: appDoctor,
      service: appService,
      status: 'UPCOMING'
    }

    const formattedDateForLog = format(new Date(appDate), 'dd MMMM', { locale: ru })
    const updated = {
      ...medical,
      appointments: [...appointments, newApp],
      history: [
        {
          date: today,
          desc: `Запланирован прием: ${appService} на ${formattedDateForLog} в ${appTime} у ${appDoctor}. (Др. Смирнова)`
        },
        ...(medical.history || [])
      ]
    }

    onUpdate(updated)
    setAppDate('')
    setAppTime('')
    setAppService('')
    setShowModal(false)
  }

  const handleToggleStatus = (appId: string) => {
    const today = new Date().toLocaleDateString('ru-RU')
    const updatedApps = appointments.map(app => {
      if (app.id === appId) {
        const nextStatus = app.status === 'UPCOMING' ? 'COMPLETED' : 'UPCOMING'
        return { ...app, status: nextStatus as any }
      }
      return app
    })

    const targetApp = appointments.find(a => a.id === appId)
    const logDesc = targetApp
      ? `Прием "${targetApp.service}" от ${format(new Date(targetApp.date), 'dd.MM.yyyy')} отмечен как ${targetApp.status === 'UPCOMING' ? 'завершенный' : 'предстоящий'}.`
      : 'Статус приема изменен.'

    const updated = {
      ...medical,
      appointments: updatedApps,
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
    <div className="appointments-container">
      <div className="apps-header">
        <h3>График посещений</h3>
        <button className="btn-primary-small" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Назначить прием
        </button>
      </div>

      <div className="apps-list">
        {appointments.length > 0 ? (
          appointments.map(app => {
            const dateObj = new Date(app.date)
            return (
              <div key={app.id} className={`app-item ${app.status.toLowerCase()}`}>
                <div className="app-date-box" onClick={() => handleToggleStatus(app.id)} style={{ cursor: 'pointer' }} title="Кликните, чтобы изменить статус">
                  <span className="day">{format(dateObj, 'dd')}</span>
                  <span className="month">{format(dateObj, 'MMM', { locale: ru })}</span>
                </div>
                <div className="app-details">
                  <div className="app-main-info">
                    <h4>{app.service}</h4>
                    <span className={`status-badge ${app.status.toLowerCase()}`}>
                      {app.status === 'UPCOMING' ? 'Предстоит' : app.status === 'COMPLETED' ? 'Завершено' : 'Отменено'}
                    </span>
                  </div>
                  <div className="app-meta">
                    <span><Clock size={14} /> {app.time}</span>
                    <span><User size={14} /> {app.doctor}</span>
                    <span><MapPin size={14} /> Кабинет 302</span>
                  </div>
                </div>
                <div className="app-actions">
                  {app.status === 'UPCOMING' && (
                    <button 
                      className="btn-reminder" 
                      onClick={() => onSendReminder({
                        ...app,
                        date: dateObj // Ensure it is formatted correctly inside the send function
                      })}
                      title="Отправить напоминание"
                    >
                      <Bell size={16} /> Напомнить
                    </button>
                  )}
                  <button className="action-btn" onClick={() => handleToggleStatus(app.id)}>
                    <CheckCircle2 size={18} style={{ color: app.status === 'COMPLETED' ? '#10b981' : '#cbd5e1' }} />
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <p className="no-data">Приемы отсутствуют</p>
        )}
      </div>

      {/* --- SCHEDULE MODAL --- */}
      {showModal && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-content glass-card">
            <div className="sub-modal-header">
              <h3>Назначить новый прием</h3>
              <button className="sub-close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleScheduleAppointment} className="sub-modal-form">
              <div className="sub-form-group">
                <label>Услуга / Процедура</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Например, УЗИ сердца или Консультация"
                  value={appService}
                  onChange={e => setAppService(e.target.value)}
                />
              </div>
              <div className="form-grid">
                <div className="sub-form-group">
                  <label>Дата</label>
                  <input 
                    type="date" 
                    required 
                    value={appDate}
                    onChange={e => setAppDate(e.target.value)}
                  />
                </div>
                <div className="sub-form-group">
                  <label>Время</label>
                  <input 
                    type="time" 
                    required 
                    value={appTime}
                    onChange={e => setAppTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="sub-form-group">
                <label>Врач</label>
                <select value={appDoctor} onChange={e => setAppDoctor(e.target.value)}>
                  <option value="Др. Смирнова">Др. Смирнова (Терапевт)</option>
                  <option value="Др. Иванов">Др. Иванов (Кардиолог)</option>
                  <option value="Др. Петров">Др. Петров (Невролог)</option>
                </select>
              </div>
              <div className="sub-modal-footer">
                <button type="button" className="sub-btn-sec" onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className="sub-btn-prim">Записать</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .appointments-container {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .apps-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .apps-header h3 {
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

        .apps-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .app-item {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.25rem;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid var(--border);
          border-radius: 1rem;
          transition: all 0.2s;
        }

        .app-item:hover {
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .app-date-box {
          width: 60px;
          height: 60px;
          background: white;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .app-date-box .day {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary);
          line-height: 1;
        }

        .app-date-box .month {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .app-details {
          flex: 1;
        }

        .app-main-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .app-main-info h4 {
          font-size: 1rem;
          color: var(--text-main);
          font-weight: 600;
        }

        .status-badge {
          font-size: 0.7rem;
          padding: 0.2rem 0.6rem;
          border-radius: 9999px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.upcoming { background: rgba(37, 99, 235, 0.1); color: var(--primary); }
        .status-badge.completed { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .status-badge.cancelled { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .app-meta {
          display: flex;
          gap: 1.25rem;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }

        .app-meta span {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .app-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .btn-reminder {
          padding: 0.5rem 0.75rem;
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.2s;
        }

        .btn-reminder:hover {
          background: #8b5cf6;
          color: white;
        }

        .action-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.5rem;
        }

        .action-btn:hover {
          background: #f1f5f9;
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
