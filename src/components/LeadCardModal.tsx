'use client'

import React, { useState } from 'react'
import { X, Phone, User, Calendar, MessageSquare, CheckCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface LeadCardModalProps {
  lead: any
  onClose: () => void
  onUpdate: (updatedLead: any) => void
}

export default function LeadCardModal({ lead, onClose, onUpdate }: LeadCardModalProps) {
  const [activeTab, setActiveTab] = useState('Основное')
  const [newNote, setNewNote] = useState('')
  const [interactionType, setInteractionType] = useState('CALL')
  const [plannedAt, setPlannedAt] = useState('')
  const [status, setStatus] = useState(lead.status)
  
  const handleAddInteraction = async () => {
    // ... logic for interactions
    if (!newNote.trim()) return
    try {
      const res = await fetch('/api/crm/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          type: interactionType,
          content: newNote,
          plannedAt: interactionType === 'TASK' && plannedAt ? plannedAt : null,
          status: interactionType === 'TASK' ? 'PLANNED' : 'COMPLETED'
        })
      })
      if (res.ok) {
        const interaction = await res.json()
        const updatedLead = { ...lead, interactions: [interaction, ...(lead.interactions || [])] }
        onUpdate(updatedLead)
        setNewNote('')
        setPlannedAt('')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleConvertToPatient = async () => {
    if (!window.confirm('Перевести этого лида в Пациенты? Будет создана ЭМК, а статус лида изменится на "Успех".')) return;
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lead.id,
          status: 'SUCCESS',
          convertToPatient: true
        })
      })
      if (res.ok) {
        const updatedLead = await res.json()
        onUpdate(updatedLead)
        alert('Карта пациента успешно создана!')
      }
    } catch (e) {
      console.error(e)
      alert('Ошибка конвертации')
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    setStatus(newStatus)
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, status: newStatus })
      })
      if (res.ok) {
        const updatedLead = await res.json()
        onUpdate(updatedLead)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">{lead.name} (Потенциальный пациент)</h2>
            <div className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg uppercase">
              Лид
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-slate-200 bg-white gap-6">
          {['Основное', 'Задачи', 'История', 'Сделки'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Column: Lead Info */}
          <div className="w-1/3 border-r border-slate-200 p-6 overflow-y-auto bg-slate-50/50">
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <User size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{lead.name}</h3>
              <p className="text-slate-500">{lead.phone}</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Сумма сделки</label>
                <div className="p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-lg">
                  {lead.expectedAmount.toLocaleString('ru-RU')} ₽
                </div>
              </div>

              <button 
                onClick={handleConvertToPatient}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all flex justify-center items-center gap-2"
              >
                <User size={18} />
                Конвертировать в Пациента
              </button>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Канал привлечения</label>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm">
                  {lead.source}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Менеджер</label>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm flex items-center gap-2">
                  <User size={16} className="text-slate-400" />
                  {lead.manager ? `${lead.manager.firstName} ${lead.manager.lastName}` : 'Не назначен'}
                </div>
              </div>

              {/* Status pipeline */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Этап воронки</label>
                <select 
                  value={status}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="NEW">Новый звонок</option>
                  <option value="CONTACTED">Взят в работу</option>
                  <option value="APPOINTMENT_SET">Записан на прием / Бронь</option>
                  <option value="SUCCESS">Успех (Стал пациентом)</option>
                  <option value="LOST">Отказ</option>
                </select>
              </div>

              <div className="pt-4">
                 <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all flex justify-center items-center gap-2">
                   <User size={18} />
                   Конвертировать в Пациента
                 </button>
              </div>
            </div>
          </div>

          {/* Right Column: Timeline & Interactions */}
          <div className="w-2/3 p-6 overflow-y-auto bg-white flex flex-col relative">
            
            {/* Input area */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-6 shadow-sm sticky top-0 z-10">
              <div className="flex gap-2 mb-3">
                <button onClick={() => setInteractionType('CALL')} className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${interactionType === 'CALL' ? 'bg-blue-100 text-blue-700' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                  <Phone size={14} /> Звонок
                </button>
                <button onClick={() => setInteractionType('MESSAGE')} className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${interactionType === 'MESSAGE' ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                  <MessageSquare size={14} /> Сообщение
                </button>
                <button onClick={() => setInteractionType('TASK')} className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${interactionType === 'TASK' ? 'bg-amber-100 text-amber-700' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                  <Calendar size={14} /> Задача
                </button>
                <button onClick={() => setInteractionType('NOTE')} className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${interactionType === 'NOTE' ? 'bg-slate-200 text-slate-700' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                  <CheckCircle size={14} /> Заметка
                </button>
              </div>
              
              {interactionType === 'TASK' && (
                <div className="mb-3">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Дата и время задачи</label>
                  <input 
                    type="datetime-local" 
                    value={plannedAt}
                    onChange={e => setPlannedAt(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Результат взаимодействия или описание задачи..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              />
              
              <div className="flex justify-end mt-3">
                <button onClick={handleAddInteraction} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors shadow-md shadow-blue-500/20">
                  Добавить
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent pl-8 md:pl-0">
              
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 -translate-x-1/2 md:static z-10">
                  <Clock size={16} />
                </div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-sm text-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Сегодня</span>
                </div>
              </div>

              {lead.interactions?.map((interaction: any) => (
                <div key={interaction.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 -translate-x-1/2 md:static z-10 ${
                    interaction.type === 'CALL' ? 'bg-blue-100 text-blue-600' :
                    interaction.type === 'MESSAGE' ? 'bg-emerald-100 text-emerald-600' :
                    interaction.type === 'TASK' ? 'bg-amber-100 text-amber-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {interaction.type === 'CALL' ? <Phone size={16} /> :
                     interaction.type === 'MESSAGE' ? <MessageSquare size={16} /> :
                     interaction.type === 'TASK' ? <Calendar size={16} /> : <CheckCircle size={16} />}
                  </div>
                  
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                        interaction.type === 'CALL' ? 'bg-blue-50 text-blue-700' :
                        interaction.type === 'MESSAGE' ? 'bg-emerald-50 text-emerald-700' :
                        interaction.type === 'TASK' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-50 text-slate-700'
                      }`}>
                        {interaction.type === 'CALL' ? 'Исходящий звонок' :
                         interaction.type === 'MESSAGE' ? 'Сообщение' :
                         interaction.type === 'TASK' ? 'Запланированная задача' : 'Заметка'}
                      </span>
                      <time className="text-xs text-slate-400 font-medium">{format(new Date(interaction.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}</time>
                    </div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">{interaction.content}</div>
                    
                    {interaction.audioUrl && (
                      <div className="mt-3">
                        <audio controls className="w-full h-8" src={interaction.audioUrl}>
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                    
                    {interaction.manager && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                        <User size={12} />
                        {interaction.manager.firstName} {interaction.manager.lastName}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 -translate-x-1/2 md:static z-10">
                  <User size={16} />
                </div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-sm text-center">
                  <div className="text-xs text-slate-500 mb-1">{format(new Date(lead.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}</div>
                  <div className="text-sm font-semibold text-slate-700">Лид зарегистрирован</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
