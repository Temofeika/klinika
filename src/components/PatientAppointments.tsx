import React from 'react'
import { Calendar, Clock, MapPin, MoreVertical, Plus, CheckCircle2, Bell, Send } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Appointment {
  id: string
  date: Date
  time: string
  doctor: string
  service: string
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED'
}

interface PatientAppointmentsProps {
  onSendReminder: (app: Appointment) => void
}

export default function PatientAppointments({ onSendReminder }: PatientAppointmentsProps) {
  const [appointments, setAppointments] = React.useState<Appointment[]>([
    { 
      id: '1', 
      date: new Date(Date.now() + 86400000), 
      time: '10:00', 
      doctor: 'Др. Смирнова', 
      service: 'Первичная консультация', 
      status: 'UPCOMING' 
    },
    { 
      id: '2', 
      date: new Date(Date.now() - 86400000 * 3), 
      time: '14:30', 
      doctor: 'Др. Иванов', 
      service: 'УЗИ брюшной полости', 
      status: 'COMPLETED' 
    }
  ])

  return (
    <div className="appointments-container">
      <div className="apps-header">
        <h3>График посещений</h3>
        <button className="btn-primary-small"><Plus size={16} /> Назначить прием</button>
      </div>

      <div className="apps-list">
        {appointments.map(app => (
          <div key={app.id} className={`app-item ${app.status.toLowerCase()}`}>
            <div className="app-date-box">
              <span className="day">{format(app.date, 'dd')}</span>
              <span className="month">{format(app.date, 'MMM', { locale: ru })}</span>
            </div>
            <div className="app-details">
              <div className="app-main-info">
                <h4>{app.service}</h4>
                <span className={`status-badge ${app.status.toLowerCase()}`}>
                  {app.status === 'UPCOMING' ? 'Предстоит' : 'Завершено'}
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
                  onClick={() => onSendReminder(app)}
                  title="Отправить напоминание"
                >
                  <Bell size={16} /> Напомнить
                </button>
              )}
              <button className="action-btn"><MoreVertical size={18} /></button>
            </div>
          </div>
        ))}
      </div>

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
      `}</style>
    </div>
  )
}

function User(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
