'use client'

import React, { useState, useEffect } from 'react'
import { Filter, Search, Plus, User, Phone, PhoneCall, X } from 'lucide-react'
import LeadCardModal from './LeadCardModal'

const STATUSES = [
  { id: 'NEW', label: '01 Новые', color: 'bg-slate-100 border-slate-300', headerText: 'text-slate-700' },
  { id: 'CONTACTED', label: '02 В работе', color: 'bg-blue-50 border-blue-200', headerText: 'text-blue-700' },
  { id: 'APPOINTMENT_SET', label: '03 Записан (Бронь)', color: 'bg-purple-50 border-purple-200', headerText: 'text-purple-700' },
  { id: 'SUCCESS', label: 'Успех', color: 'bg-emerald-50 border-emerald-200', headerText: 'text-emerald-700' },
  { id: 'LOST', label: 'Отказ', color: 'bg-red-50 border-red-200', headerText: 'text-red-700' }
]

export default function CrmDashboard() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // New Lead Form State
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newSource, setNewSource] = useState('Входящий звонок')
  const [newAmount, setNewAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/crm/leads')
      if (res.ok) {
        const data = await res.json()
        setLeads(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          phone: newPhone,
          source: newSource,
          expectedAmount: newAmount || 0
        })
      })
      if (res.ok) {
        setShowAddModal(false)
        setNewName(''); setNewPhone(''); setNewAmount(''); setNewSource('Входящий звонок')
        fetchLeads()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateLead = (updatedLead: any) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l))
    setSelectedLead(updatedLead) // Update modal data
  }

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.phone.includes(searchQuery)
  )

  const calculateTotal = (status: string) => {
    return filteredLeads.filter(l => l.status === status).reduce((acc, curr) => acc + curr.expectedAmount, 0)
  }

  return (
    <div className="p-8 pb-32 h-screen overflow-y-auto bg-slate-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <PhoneCall className="text-blue-500" size={32} />
            Монитор продаж (CRM)
          </h1>
          <p className="text-slate-500 mt-2">Воронка потенциальных пациентов и история взаимодействий</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Поиск лида..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap shadow-md shadow-blue-500/20">
            <Plus size={20} /> Новый лид
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">Загрузка воронки...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-8 h-[calc(100vh-200px)] items-start">
          {STATUSES.map(status => {
            const statusLeads = filteredLeads.filter(l => l.status === status.id)
            const total = calculateTotal(status.id)
            
            return (
              <div key={status.id} className="min-w-[300px] w-[300px] flex flex-col h-full">
                {/* Column Header */}
                <div className={`p-3 rounded-t-xl border-t border-l border-r ${status.color} flex justify-between items-center mb-0`}>
                  <div className={`font-bold text-sm ${status.headerText}`}>{status.label}</div>
                  <div className="text-xs font-semibold bg-white/50 px-2 py-1 rounded-md">{statusLeads.length}</div>
                </div>
                
                {/* Column Body */}
                <div className={`flex-1 bg-slate-100/50 border-l border-r border-b border-dashed border-slate-300 rounded-b-xl p-2 overflow-y-auto space-y-3`}>
                  
                  {/* Total amount for column */}
                  {total > 0 && (
                    <div className="text-center py-1 text-xs font-bold text-slate-400">
                      {total.toLocaleString('ru-RU')} ₽
                    </div>
                  )}

                  {statusLeads.map(lead => (
                    <div 
                      key={lead.id} 
                      onClick={() => setSelectedLead(lead)}
                      className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
                    >
                      <div className="font-bold text-slate-800 text-sm mb-1 group-hover:text-blue-600 transition-colors">{lead.name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                        <Phone size={12} /> {lead.phone}
                      </div>
                      
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{lead.source}</span>
                        {lead.expectedAmount > 0 && (
                          <span className="text-xs font-bold text-slate-700">{lead.expectedAmount.toLocaleString('ru-RU')} ₽</span>
                        )}
                      </div>
                      
                      {lead.interactions?.length > 0 && (
                        <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg truncate">
                          {lead.interactions[0].content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Новый лид (Потенциальный пациент)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Имя Клиента</label>
                <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Иван Иванов" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Телефон</label>
                <input required type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="+7 (999) 000-00-00" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Канал привлечения</label>
                <select value={newSource} onChange={e => setNewSource(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="Входящий звонок">Входящий звонок</option>
                  <option value="Соцсети">Социальные сети</option>
                  <option value="Рекомендация">Рекомендация</option>
                  <option value="Яндекс/Гугл">Яндекс / Google</option>
                  <option value="Промо">Промо-акция</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Ожидаемая сумма (₽)</label>
                <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                  Отмена
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-blue-500/20">
                  {saving ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {selectedLead && (
        <LeadCardModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)}
          onUpdate={handleUpdateLead}
        />
      )}

    </div>
  )
}
