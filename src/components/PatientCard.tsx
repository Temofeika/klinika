'use client'

import React from 'react'
import { MessageSquare, Send, Phone, User, Calendar, FileText, Share2, Check, CheckCheck, Search, Files, ClipboardList, CreditCard, Microscope, X } from 'lucide-react'
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
  doctorId?: string | null
  doctor?: {
    id: string
    firstName: string
    lastName: string
    position: string
  } | null
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

  // Photo Preview Modal States
  const [previewPhoto, setPreviewPhoto] = React.useState<{ url: string; name: string } | null>(null)

  // Listen to Escape key press to close modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewPhoto(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Doctor Assignment States
  const [doctorsList, setDoctorsList] = React.useState<any[]>([])
  const [assigningDoc, setAssigningDoc] = React.useState(false)

  // Edit Profile States
  const [isEditing, setIsEditing] = React.useState(false)
  const [editForm, setEditForm] = React.useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    notes: ''
  })

  // Synchronize state when selected patient changes
  React.useEffect(() => {
    setPatient(initialPatient)
    setIsEditing(false)
    setEditForm({
      firstName: initialPatient.firstName || '',
      lastName: initialPatient.lastName || '',
      phone: initialPatient.phone || '',
      email: initialPatient.email || '',
      dateOfBirth: initialPatient.dateOfBirth ? new Date(initialPatient.dateOfBirth).toISOString().split('T')[0] : '',
      gender: initialPatient.gender || '',
      notes: initialPatient.notes || ''
    })
  }, [initialPatient])

  // Fetch doctors list for routing dropdown selection
  React.useEffect(() => {
    fetch('/api/doctors')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDoctorsList(data)
      })
      .catch(console.error)
  }, [])

  const handleAssignDoctor = async (targetDoctorId: string) => {
    setAssigningDoc(true)
    try {
      const res = await fetch('/api/patient/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          doctorId: targetDoctorId || null
        })
      })
      const data = await res.json()
      if (data.success) {
        setPatient({
          ...patient,
          doctorId: data.patient.doctorId,
          doctor: data.patient.doctor,
          medicalRecord: data.patient.medicalRecord
        })
      }
    } catch (err) {
      console.error('Failed to assign doctor:', err)
    } finally {
      setAssigningDoc(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const res = await fetch('/api/patient', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: patient.id,
          ...editForm
        })
      })
      const data = await res.json()
      if (res.ok) {
        setPatient(data)
        setIsEditing(false)
      } else {
        alert(data.error || 'Ошибка при сохранении профиля')
      }
    } catch (err: any) {
      console.error(err)
      alert('Ошибка соединения с сервером')
    }
  }

  // Templates Integration States
  const [showTemplates, setShowTemplates] = React.useState(false)
  const [templates, setTemplates] = React.useState<any[]>([])
  const [searchTemplateQuery, setSearchTemplateQuery] = React.useState('')
  const [selectedTemplate, setSelectedTemplate] = React.useState<any | null>(null)
  const [templateParams, setTemplateParams] = React.useState<string[]>([])
  const [paramValues, setParamValues] = React.useState<Record<string, string>>({})

  const renderMessageContent = (content: string) => {
    // Check if the content is formatted as: 📎 Документ: [filename](url)
    const docRegex = /📎 Документ:\s*\[(.*?)\]\((.*?)\)/
    // Check if the content is formatted as: 🖼️ Фото: [filename](url)
    const photoRegex = /🖼️ Фото:\s*\[(.*?)\]\((.*?)\)/

    const docMatch = content.match(docRegex)
    if (docMatch) {
      const fileName = docMatch[1]
      const fileUrl = docMatch[2]
      return (
        <div className="attachment-bubble doc-attachment">
          <div className="attachment-header">
            <span className="attachment-icon">📎</span>
            <span className="attachment-name" title={fileName}>{fileName}</span>
          </div>
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="attachment-link-btn"
          >
            Открыть документ
          </a>
        </div>
      )
    }

    const photoMatch = content.match(photoRegex)
    if (photoMatch) {
      const photoName = photoMatch[1]
      const photoUrl = photoMatch[2]
      return (
        <div className="attachment-bubble photo-attachment">
          <div className="photo-preview-wrapper">
            <img 
              src={photoUrl} 
              alt={photoName} 
              className="chat-photo-preview" 
              onClick={() => setPreviewPhoto({ url: photoUrl, name: photoName })}
            />
          </div>
          <span className="photo-caption">{photoName}</span>
        </div>
      )
    }

    return <div className="text-message-body">{content}</div>
  }

  // Fetch templates when opening template menu
  React.useEffect(() => {
    if (showTemplates) {
      fetch('/api/templates')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setTemplates(data)
        })
        .catch(console.error)
    }
  }, [showTemplates])

  const handleSelectTemplate = (template: any) => {
    const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g
    const params: string[] = []
    let match
    while ((match = regex.exec(template.content)) !== null) {
      if (!params.includes(match[1])) {
        params.push(match[1])
      }
    }

    const initialValues: Record<string, string> = {}
    if (params.includes('name')) {
      initialValues['name'] = patient.firstName
    }

    const customParams = params.filter(p => p !== 'name')
    if (customParams.length > 0) {
      setSelectedTemplate(template)
      setTemplateParams(params)
      setParamValues(initialValues)
    } else {
      let interpolatedText = template.content
      if (params.includes('name')) {
        interpolatedText = interpolatedText.replace(/\{\{name\}\}/g, patient.firstName)
      }
      setInput(interpolatedText)
      setShowTemplates(false)
    }
  }

  const handleConfirmInterpolation = () => {
    if (!selectedTemplate) return

    let interpolatedText = selectedTemplate.content
    templateParams.forEach(p => {
      const val = paramValues[p] || `{{${p}}}`
      const regex = new RegExp(`\\{\\{${p}\\}\\}`, 'g')
      interpolatedText = interpolatedText.replace(regex, val)
    })

    setInput(interpolatedText)
    setSelectedTemplate(null)
    setShowTemplates(false)
  }

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

  const activeDoctorObj = doctorsList.find(d => d.id === doctorId)
  const isAdministrator = activeDoctorObj?.position === 'Администратор'

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
          <div className="doctor-assignment-header">
            <User size={14} className="doctor-select-icon" />
            <label htmlFor="doctor-select">Лечащий врач:</label>
            <select 
              id="doctor-select"
              value={patient.doctorId || ''} 
              onChange={(e) => handleAssignDoctor(e.target.value)}
              disabled={assigningDoc}
              className="doctor-select-input"
            >
              <option value="">-- Не назначен --</option>
              {doctorsList.map(doc => (
                <option key={doc.id} value={doc.id}>
                  {doc.lastName} {doc.firstName} ({doc.position})
                </option>
              ))}
            </select>
          </div>
          <button className="btn-primary"><Share2 size={18} /> Экспорт</button>
        </div>
      </div>

      <div className="patient-content">
        {isEditing ? (
          <div className="glass-card patient-details editing-sidebar">
            <h3 className="editing-title">Редактирование профиля</h3>
            <div className="edit-form-fields">
              <div className="edit-field">
                <label>Фамилия</label>
                <input 
                  type="text" 
                  value={editForm.lastName} 
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} 
                  className="edit-input"
                />
              </div>
              <div className="edit-field">
                <label>Имя</label>
                <input 
                  type="text" 
                  value={editForm.firstName} 
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} 
                  className="edit-input"
                />
              </div>
              <div className="edit-field">
                <label>Телефон</label>
                <input 
                  type="text" 
                  value={editForm.phone} 
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} 
                  className="edit-input"
                />
              </div>
              <div className="edit-field">
                <label>Email</label>
                <input 
                  type="email" 
                  value={editForm.email} 
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} 
                  className="edit-input"
                />
              </div>
              <div className="edit-field">
                <label>Дата рождения</label>
                <input 
                  type="date" 
                  value={editForm.dateOfBirth} 
                  onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })} 
                  className="edit-input"
                />
              </div>
              <div className="edit-field">
                <label>Пол</label>
                <select 
                  value={editForm.gender} 
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} 
                  className="edit-select"
                >
                  <option value="">Не указан</option>
                  <option value="MALE">Мужской</option>
                  <option value="FEMALE">Женский</option>
                </select>
              </div>
              <div className="edit-field">
                <label>Заметки / Описание</label>
                <textarea 
                  value={editForm.notes} 
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} 
                  className="edit-textarea"
                  rows={4}
                />
              </div>
            </div>
            <div className="edit-actions">
              <button className="btn-save-profile" onClick={handleSaveProfile}>Сохранить</button>
              <button className="btn-cancel-profile" onClick={() => setIsEditing(false)}>Отмена</button>
            </div>
          </div>
        ) : (
          <div className="glass-card patient-details">
            <h3><FileText size={18} /> Заметки</h3>
            <p className="patient-notes-para">{patient.notes || 'Заметок нет'}</p>
            
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

            {isAdministrator && (
              <button 
                className="btn-edit-profile-trigger" 
                onClick={() => setIsEditing(true)}
              >
                Редактировать профиль
              </button>
            )}
          </div>
        )}

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
                      <div className="message-content">{renderMessageContent(msg.content)}</div>
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
                  {/* Template Selector Button and Popover */}
                  <div className="template-dropdown-container">
                    <button 
                      type="button" 
                      className={`template-trigger-btn ${showTemplates ? 'active' : ''}`}
                      onClick={() => setShowTemplates(!showTemplates)}
                      title="Выбрать быстрый шаблон"
                    >
                      <ClipboardList size={20} />
                    </button>

                    {showTemplates && (
                      <div className="templates-popover glass-card">
                        <div className="popover-header">
                          <span>Быстрые шаблоны</span>
                          <button type="button" className="popover-close-btn" onClick={() => setShowTemplates(false)}>
                            <X size={14} />
                          </button>
                        </div>
                        
                        <div className="popover-search">
                          <Search size={14} className="search-icon" />
                          <input 
                            type="text" 
                            placeholder="Поиск..." 
                            value={searchTemplateQuery}
                            onChange={(e) => setSearchTemplateQuery(e.target.value)}
                          />
                        </div>

                        <div className="popover-list">
                          {templates.length === 0 ? (
                            <div className="popover-empty">Загрузка...</div>
                          ) : templates.filter(t => t.name.toLowerCase().includes(searchTemplateQuery.toLowerCase())).length === 0 ? (
                            <div className="popover-empty">Ничего не найдено</div>
                          ) : (
                            templates
                              .filter(t => t.name.toLowerCase().includes(searchTemplateQuery.toLowerCase()))
                              .map(t => (
                                <div 
                                  key={t.id} 
                                  className="popover-item"
                                  onClick={() => handleSelectTemplate(t)}
                                >
                                  <div className="popover-item-name">{t.name}</div>
                                  <div className="popover-item-preview">{t.content}</div>
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

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

              {/* Custom Parameter Interpolation Modal */}
              {selectedTemplate && (
                <div className="interpolation-modal-overlay">
                  <div className="interpolation-modal glass-card">
                    <div className="interpolation-header">
                      <h4><ClipboardList size={18} /> Заполнение параметров шаблона</h4>
                      <button type="button" onClick={() => setSelectedTemplate(null)}><X size={18} /></button>
                    </div>
                    
                    <div className="interpolation-body">
                      <div className="template-preview-box">
                        <strong>Шаблон:</strong> {selectedTemplate.name}
                        <p>{selectedTemplate.content}</p>
                      </div>
                      
                      <div className="interpolation-fields">
                        {templateParams.map(param => (
                          <div key={param} className="interpolation-field-group">
                            <label>
                              {param === 'name' ? 'Имя пациента' : param === 'date' ? 'Дата' : param === 'time' ? 'Время' : param}
                            </label>
                            <input 
                              type="text"
                              placeholder={`Введите значение для {{${param}}}`}
                              value={paramValues[param] || ''}
                              onChange={(e) => setParamValues({ ...paramValues, [param]: e.target.value })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="interpolation-footer">
                      <button type="button" className="btn-cancel" onClick={() => setSelectedTemplate(null)}>Отмена</button>
                      <button type="button" className="btn-primary" onClick={handleConfirmInterpolation}>Вставить в чат</button>
                    </div>
                  </div>
                </div>
              )}
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

      {/* Photo Preview Modal Overlay */}
      {previewPhoto && (
        <div className="photo-modal-overlay" onClick={() => setPreviewPhoto(null)}>
          <button className="photo-modal-close" onClick={() => setPreviewPhoto(null)}>
            &times;
          </button>
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={previewPhoto.url} alt={previewPhoto.name} className="photo-modal-img" />
            <div className="photo-modal-caption">{previewPhoto.name}</div>
          </div>
        </div>
      )}

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

        /* --- Templates Integration Styles --- */
        .template-dropdown-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .template-trigger-btn {
          background: #f1f5f9;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          width: 45px;
          height: 45px;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .template-trigger-btn:hover, .template-trigger-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.15);
        }

        .templates-popover {
          position: absolute;
          bottom: calc(100% + 0.75rem);
          left: 0;
          width: 320px;
          background: white;
          border-radius: 1.25rem;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
          z-index: 1000;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.5);
          animation: popoverSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes popoverSlideUp {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .popover-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--text-main);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .popover-close-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .popover-close-btn:hover {
          background: #f1f5f9;
          color: var(--text-main);
        }

        .popover-search {
          position: relative;
          display: flex;
          align-items: center;
        }

        .popover-search .search-icon {
          position: absolute;
          left: 0.75rem;
          color: var(--text-secondary);
        }

        .popover-search input {
          width: 100%;
          padding: 0.5rem 0.75rem 0.5rem 2rem !important;
          border: 1px solid var(--border);
          border-radius: 0.5rem !important;
          font-size: 0.8rem !important;
          outline: none;
          background: #f8fafc;
        }

        .popover-list {
          max-height: 200px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-right: -0.25rem;
          padding-right: 0.25rem;
        }

        .popover-item {
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .popover-item:hover {
          background: white;
          border-color: rgba(37, 99, 235, 0.3);
          box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }

        .popover-item-name {
          font-weight: 700;
          font-size: 0.8rem;
          color: var(--text-main);
          margin-bottom: 0.2rem;
        }

        .popover-item-preview {
          font-size: 0.75rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .popover-empty {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-align: center;
          padding: 1.5rem 0;
          font-style: italic;
        }

        /* --- Parameter Interpolation Modal --- */
        .interpolation-modal-overlay {
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
          z-index: 2200;
          animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .interpolation-modal {
          width: 480px;
          background: white;
          border-radius: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.5);
          animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes modalSlideUp {
          from { transform: translateY(20px) scale(0.95); }
          to { transform: translateY(0) scale(1); }
        }

        .interpolation-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .interpolation-header h4 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .interpolation-header button {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .interpolation-header button:hover {
          background: #f1f5f9;
          color: var(--text-main);
        }

        .interpolation-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          max-height: 400px;
          overflow-y: auto;
        }

        .template-preview-box {
          background: #f8fafc;
          border: 1px solid var(--border);
          padding: 1rem;
          border-radius: 0.75rem;
          font-size: 0.85rem;
          color: var(--text-main);
          line-height: 1.5;
        }

        .template-preview-box strong {
          color: var(--primary);
        }

        .template-preview-box p {
          margin-top: 0.4rem;
          color: var(--text-secondary);
        }

        .interpolation-fields {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .interpolation-field-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .interpolation-field-group label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .interpolation-field-group input {
          width: 100%;
          padding: 0.75rem 1rem !important;
          border: 1px solid var(--border);
          border-radius: 0.75rem !important;
          font-size: 0.9rem !important;
          outline: none;
          background: #f8fafc;
          transition: all 0.2s;
        }

        .interpolation-field-group input:focus {
          border-color: var(--primary);
          background: white;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
        }

        .interpolation-footer {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          background: #f8fafc;
        }

        .interpolation-footer button {
          padding: 0.65rem 1.25rem;
          border-radius: 0.75rem;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .interpolation-footer .btn-cancel {
          background: white;
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }

        .interpolation-footer .btn-cancel:hover {
          background: #f1f5f9;
          color: var(--text-main);
        }

        .interpolation-footer .btn-primary {
          background: var(--primary);
          color: white;
        }

        .interpolation-footer .btn-primary:hover {
          background: var(--primary-hover);
        }

        /* Message Attachment Styles */
        .attachment-bubble {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.25rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 0.75rem;
          width: 240px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .doc-attachment {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .attachment-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .attachment-icon {
          font-size: 1.25rem;
        }
        
        .attachment-name {
          font-weight: 500;
          font-size: 0.85rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: inherit;
        }
        
        .attachment-link-btn {
          display: block;
          text-align: center;
          padding: 0.35rem 0.75rem;
          background: rgba(255, 255, 255, 0.25);
          color: inherit !important;
          border-radius: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.2s;
        }
        
        .attachment-link-btn:hover {
          background: rgba(255, 255, 255, 0.4);
        }
        
        .photo-attachment {
          border: none;
          background: transparent;
          padding: 0;
          width: 130px;
        }
        
        .photo-preview-wrapper {
          border-radius: 0.6rem;
          overflow: hidden;
          border: 1px solid var(--border);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          cursor: pointer;
          max-height: 100px;
          position: relative;
        }
        
        .chat-photo-preview {
          width: 100%;
          height: auto;
          max-height: 100px;
          object-fit: cover;
          display: block;
          transition: all 0.25s ease;
        }
        
        .photo-preview-wrapper:hover .chat-photo-preview {
          transform: scale(1.08);
          filter: brightness(0.9);
        }
        
        .photo-caption {
          font-size: 0.7rem;
          color: var(--text-secondary);
          margin-top: 0.2rem;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Doctor Assignment Select Styles */
        .doctor-assignment-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-right: 1rem;
          background: rgba(255, 255, 255, 0.85);
          padding: 0.4rem 0.85rem;
          border-radius: 0.85rem;
          border: 1px solid var(--border);
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .doctor-select-icon {
          color: var(--text-secondary);
        }

        .doctor-assignment-header label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .doctor-select-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-main);
          cursor: pointer;
        }

        .doctor-select-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Edit Profile Styles */
        .editing-sidebar {
          max-height: 85vh;
          overflow-y: auto;
        }

        .editing-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
        }

        .edit-form-fields {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .edit-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .edit-field label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .edit-input, .edit-select, .edit-textarea {
          padding: 0.55rem 0.75rem;
          border-radius: 0.6rem;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.9);
          color: var(--text-main);
          font-size: 0.85rem;
          font-weight: 500;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .edit-input:focus, .edit-select:focus, .edit-textarea:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
        }

        .edit-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .btn-save-profile {
          flex: 1;
          padding: 0.6rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 0.6rem;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-save-profile:hover {
          background: var(--primary-hover);
        }

        .btn-cancel-profile {
          padding: 0.6rem 1rem;
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-main);
          border: none;
          border-radius: 0.6rem;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-cancel-profile:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .btn-edit-profile-trigger {
          width: 100%;
          margin-top: 1.25rem;
          padding: 0.6rem;
          background: rgba(0, 0, 0, 0.04);
          border: 1px dashed var(--border);
          border-radius: 0.6rem;
          color: var(--text-main);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-edit-profile-trigger:hover {
          background: rgba(var(--primary-rgb), 0.05);
          border-color: var(--primary);
          color: var(--primary);
        }

        /* Premium Photo Preview Modal Styles */
        .photo-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 99999;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          animation: photoFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .photo-modal-close {
          position: absolute;
          top: 2rem;
          right: 2rem;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          width: 3.25rem;
          height: 3.25rem;
          border-radius: 50%;
          color: white;
          font-size: 2rem;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 100000;
        }

        .photo-modal-close:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: rotate(90deg) scale(1.1);
        }

        .photo-modal-content {
          position: relative;
          max-width: 90vw;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1.25rem;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
          animation: photoScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .photo-modal-img {
          max-width: 100%;
          max-height: 72vh;
          object-fit: contain;
          background: #0f172a;
        }

        .photo-modal-caption {
          width: 100%;
          padding: 1rem 1.5rem;
          background: rgba(15, 23, 42, 0.8);
          color: #f8fafc;
          text-align: center;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        @keyframes photoFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes photoScaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
