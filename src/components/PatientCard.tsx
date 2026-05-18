'use client'

import React from 'react'
import { MessageSquare, Send, Phone, User, Calendar, FileText, Share2, Check, CheckCheck, Search, Files, ClipboardList, CreditCard, Microscope } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import PatientDocuments from './PatientDocuments'
import PatientAppointments from './PatientAppointments'
import PatientMedicalCard from './PatientMedicalCard'
import PatientBilling from './PatientBilling'
import PatientLabs from './PatientLabs'

interface Message {
  id: string
  content: string
  source: 'TELEGRAM' | 'MAX'
  timestamp: Date
  isIncoming: boolean
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string | null
  dateOfBirth?: Date | null
  gender?: string | null
  notes?: string | null
  medicalRecord?: string | null
  messages: Message[]
}

const defaultMedical = {
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
  ],
  appointments: [
    { id: '1', date: '2026-05-19', time: '10:00', doctor: 'Др. Смирнова', service: 'Первичная консультация', status: 'UPCOMING' },
    { id: '2', date: '2026-05-15', time: '14:30', doctor: 'Др. Иванов', service: 'УЗИ брюшной полости', status: 'COMPLETED' }
  ],
  billing: [
    { id: '1', date: '15.05.2026', service: 'Первичный прием терапевта', amount: 2500, status: 'PAID' },
    { id: '2', date: '12.05.2026', service: 'УЗИ брюшной полости', amount: 3200, status: 'PAID' },
    { id: '3', date: '10.05.2026', service: 'Анализ крови (общий)', amount: 1500, status: 'PENDING' }
  ],
  labs: [
    { id: '1', name: 'Глюкоза (кровь)', value: 5.4, unit: 'ммоль/л', reference: '3.3 - 5.5', status: 'NORMAL' },
    { id: '2', name: 'Холестерин общий', value: 6.2, unit: 'ммоль/л', reference: '3.1 - 5.2', status: 'HIGH' },
    { id: '3', name: 'Гемоглобин', value: 135, unit: 'г/л', reference: '130 - 160', status: 'NORMAL' },
    { id: '4', name: 'Железо', value: 9.1, unit: 'мкмоль/л', reference: '10.7 - 32.2', status: 'LOW' }
  ],
  documents: [
    { id: '1', name: 'Результаты ЭКГ.pdf', size: '1.2 MB', date: '12.05.2026' },
    { id: '2', name: 'Направление на анализы.docx', size: '420 KB', date: '10.05.2026' }
  ],
  history: [
    { date: '15.05.2026', desc: 'Обновлен список препаратов. Добавлен Магне B6. (Др. Смирнова)' },
    { date: '12.03.2026', desc: 'Установлен основной диагноз: Гипертоническая болезнь II ст. (Др. Иванов)' }
  ]
}

export default function PatientCard({ patient: initialPatient, doctorId }: { patient: Patient; doctorId?: string }) {
  const [patient, setPatient] = React.useState(initialPatient)
  const [input, setInput] = React.useState('')
  const [chatSearch, setChatSearch] = React.useState('')
  const [showSearch, setShowSearch] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'CHAT' | 'DOCS' | 'APPS' | 'MEDICAL' | 'BILLING' | 'LABS'>('CHAT')
  const [platform, setPlatform] = React.useState<'TELEGRAM' | 'MAX'>('TELEGRAM')
  const [sending, setSending] = React.useState(false)

  // Synchronize state when selected patient changes
  React.useEffect(() => {
    setPatient(initialPatient)
  }, [initialPatient])

  const getMedicalData = () => {
    if (patient.medicalRecord) {
      try {
        return JSON.parse(patient.medicalRecord)
      } catch (e) {
        console.error('Failed to parse medicalRecord:', e)
      }
    }
    return defaultMedical
  }

  const medical = getMedicalData()

  const handleUpdateMedical = async (updatedMedical: any) => {
    try {
      const res = await fetch('/api/patient/medical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          medicalRecord: updatedMedical
        })
      })

      if (res.ok) {
        setPatient(prev => ({
          ...prev,
          medicalRecord: JSON.stringify(updatedMedical)
        }))
      } else {
        console.error('Failed to save medical records')
      }
    } catch (err) {
      console.error('Error saving medical records:', err)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch('/api/messengers/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          platform,
          content: input,
          doctorId
        })
      })

      if (res.ok) {
        const { message } = await res.json()
        setPatient({
          ...patient,
          messages: [...patient.messages, message]
        })
        setInput('')
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  const handleSendReminder = async (app: any) => {
    const reminderText = `Напоминание: у вас назначен прием "${app.service}" на ${format(app.date, 'dd MMMM', { locale: ru })} в ${app.time}. Ждем вас!`
    
    setSending(true)
    try {
      const res = await fetch('/api/messengers/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          content: reminderText,
          platform: platform, // Use current selected platform
          doctorId
        })
      })

      if (res.ok) {
        const { message } = await res.json()
        setPatient({
          ...patient,
          messages: [...patient.messages, message]
        })
        alert('Напоминание успешно отправлено!')
      }
    } catch (err) {
      console.error('Failed to send reminder:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend()
  }
  return (
    <div className="patient-container">
      <div className="glass-card patient-header">
        <div className="patient-avatar">
          <User size={40} />
        </div>
        <div className="patient-info">
          <h1>{patient.lastName} {patient.firstName}</h1>
          <div className="patient-meta">
            <span><Phone size={14} /> {patient.phone}</span>
            {patient.email && <span><FileText size={14} /> {patient.email}</span>}
            {patient.dateOfBirth && (
              <span><Calendar size={14} /> {format(new Date(patient.dateOfBirth), 'dd MMMM yyyy', { locale: ru })}</span>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-primary"><Share2 size={18} /> Экспорт</button>
        </div>
      </div>

      <div className="patient-content">
        <div className="glass-card patient-details">
          <h3><FileText size={18} /> Заметки</h3>
          <p>{patient.notes || 'Заметок нет'}</p>
          
          <div className="messenger-status">
            <h3>Подключенные мессенджеры</h3>
            <div className="status-item">
              <span className="messenger-badge badge-telegram">Telegram</span>
              <span className="status-online">Активен</span>
            </div>
            <div className="status-item">
              <span className="messenger-badge badge-max">Max</span>
              <span className="status-online">Активен</span>
            </div>
          </div>
        </div>

        <div className="glass-card main-activity-container">
          <div className="tabs-navigation">
            <button 
              className={`tab-btn ${activeTab === 'CHAT' ? 'active' : ''}`} 
              onClick={() => setActiveTab('CHAT')}
            >
              <MessageSquare size={18} /> Чат
            </button>
            <button 
              className={`tab-btn ${activeTab === 'DOCS' ? 'active' : ''}`} 
              onClick={() => setActiveTab('DOCS')}
            >
              <Files size={18} /> Документы
            </button>
            <button 
              className={`tab-btn ${activeTab === 'APPS' ? 'active' : ''}`} 
              onClick={() => setActiveTab('APPS')}
            >
              <Calendar size={18} /> Приемы
            </button>
            <button 
              className={`tab-btn ${activeTab === 'MEDICAL' ? 'active' : ''}`} 
              onClick={() => setActiveTab('MEDICAL')}
            >
              <ClipboardList size={18} /> Мед. карта
            </button>
            <button 
              className={`tab-btn ${activeTab === 'BILLING' ? 'active' : ''}`} 
              onClick={() => setActiveTab('BILLING')}
            >
              <CreditCard size={18} /> Счета
            </button>
            <button 
              className={`tab-btn ${activeTab === 'LABS' ? 'active' : ''}`} 
              onClick={() => setActiveTab('LABS')}
            >
              <Microscope size={18} /> Анализы
            </button>
          </div>

          {activeTab === 'CHAT' ? (
            <>
              {/* Chat Content */}
              <div className="chat-header">
                <h3>Единая история сообщений</h3>
                <div className="chat-actions">
                  {showSearch && (
                    <input 
                      type="text" 
                      className="chat-search-input" 
                      placeholder="Поиск по переписке..." 
                      autoFocus
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                    />
                  )}
                  <button className={`chat-action-btn ${showSearch ? 'active' : ''}`} onClick={() => {
                    setShowSearch(!showSearch);
                    if (showSearch) setChatSearch('');
                  }}>
                    <Search size={18} />
                  </button>
                </div>
              </div>
              <div className="chat-messages">
                {patient.messages
                  .filter(m => m.content.toLowerCase().includes(chatSearch.toLowerCase()))
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .map((msg) => (
                  <div key={msg.id} className={`chat-wrapper ${msg.isIncoming ? 'incoming' : 'outgoing'}`}>
                    <div className={`chat-bubble ${msg.isIncoming ? 'incoming' : 'outgoing'}`}>
                      <div className="message-header">
                        <span className={`messenger-badge ${msg.source === 'TELEGRAM' ? 'badge-telegram' : 'badge-max'}`}>
                          {msg.source}
                        </span>
                      </div>
                      <div className="message-content">{msg.content}</div>
                      <div className="message-footer">
                        <span className="message-time">
                          {format(new Date(msg.timestamp), 'HH:mm', { locale: ru })}
                        </span>
                        {!msg.isIncoming && (
                          <span className="message-status">
                            <CheckCheck size={14} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chat-input-area">
                <div className="input-wrapper">
                  <input 
                    type="text" 
                    placeholder="Введите сообщение..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                  />
                  <button 
                    className="send-btn" 
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    style={{ opacity: sending || !input.trim() ? 0.5 : 1 }}
                  >
                    <Send size={20} />
                  </button>
                </div>
                <div className="input-source-selector">
                  <span>Отправить через:</span>
                  <label>
                    <input 
                      type="radio" 
                      name="source" 
                      value="TELEGRAM" 
                      checked={platform === 'TELEGRAM'}
                      onChange={() => setPlatform('TELEGRAM')}
                    /> Telegram
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name="source" 
                      value="MAX" 
                      checked={platform === 'MAX'}
                      onChange={() => setPlatform('MAX')}
                    /> Max
                  </label>
                </div>
              </div>
            </>
          ) : activeTab === 'DOCS' ? (
            <PatientDocuments medical={medical} onUpdate={handleUpdateMedical} />
          ) : activeTab === 'APPS' ? (
            <PatientAppointments medical={medical} onUpdate={handleUpdateMedical} onSendReminder={handleSendReminder} />
          ) : activeTab === 'MEDICAL' ? (
            <PatientMedicalCard medical={medical} onUpdate={handleUpdateMedical} />
          ) : activeTab === 'BILLING' ? (
            <PatientBilling medical={medical} onUpdate={handleUpdateMedical} />
          ) : (
            <PatientLabs medical={medical} onUpdate={handleUpdateMedical} />
          )}
        </div>
      </div>

      <style jsx>{`
        .patient-container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 1rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .patient-header {
          padding: 1.5rem 2rem;
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .patient-avatar {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          border: 4px solid white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .patient-info h1 {
          font-size: 1.75rem;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }

        .patient-meta {
          display: flex;
          gap: 1.5rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .patient-meta span {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .header-actions {
          margin-left: auto;
        }

        .patient-content {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 1.5rem;
        }

        .patient-details {
          padding: 1.5rem;
          height: fit-content;
        }

        .patient-details h3 {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-main);
        }

        .patient-details p {
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 0.95rem;
          margin-bottom: 2rem;
        }

        .messenger-status h3 {
          margin-top: 1rem;
        }

        .status-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 0.75rem;
        }

        .status-online {
          font-size: 0.8rem;
          color: var(--success);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .status-online::before {
          content: '';
          width: 8px;
          height: 8px;
          background: var(--success);
          border-radius: 50%;
        }

        .main-activity-container {
          display: flex;
          flex-direction: column;
          height: 700px;
          overflow: hidden;
        }

        .tabs-navigation {
          display: flex;
          padding: 0.75rem 1rem;
          background: #f1f5f9;
          gap: 0.5rem;
          border-bottom: 1px solid var(--border);
        }

        .tab-btn {
          padding: 0.6rem 1.25rem;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.85rem;
          border-radius: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          background: rgba(37, 99, 235, 0.05);
          color: var(--primary);
        }

        .tab-btn.active {
          background: white;
          color: var(--primary);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .chat-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chat-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .chat-search-input {
          padding: 0.4rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          font-size: 0.85rem;
          outline: none;
          width: 200px;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; width: 0; }
          to { opacity: 1; width: 200px; }
        }

        .chat-action-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.4rem;
          border-radius: 0.4rem;
          transition: all 0.2s;
        }

        .chat-action-btn:hover, .chat-action-btn.active {
          background: #f1f5f9;
          color: var(--primary);
        }

        .message-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.4rem;
          margin-top: 0.25rem;
        }

        .message-status {
          color: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
        }

        .incoming .message-status {
          color: var(--text-secondary);
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: rgba(248, 250, 252, 0.5);
        }

        .chat-wrapper {
          display: flex;
          flex-direction: column;
        }

        .chat-wrapper.incoming { align-items: flex-start; }
        .chat-wrapper.outgoing { align-items: flex-end; }

        .message-header {
          margin-bottom: 0.25rem;
        }

        .message-time {
          font-size: 0.7rem;
          opacity: 0.6;
          margin-top: 0.25rem;
          text-align: right;
        }

        .chat-input-area {
          padding: 1.5rem;
          border-top: 1px solid var(--border);
          background: white;
        }

        .input-wrapper {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .input-wrapper input {
          flex: 1;
          padding: 0.75rem 1.25rem;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .input-wrapper input:focus {
          border-color: var(--primary);
        }

        .send-btn {
          background: var(--primary);
          color: white;
          width: 45px;
          height: 45px;
          border-radius: 0.75rem;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-btn:hover {
          transform: scale(1.05);
          background: var(--primary-hover);
        }

        .input-source-selector {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .input-source-selector label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
