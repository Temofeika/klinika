'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, Stethoscope } from 'lucide-react'

interface Service {
  id: string
  code: string
  name: string
  price: number
  category: string
  duration: number
}

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    price: '',
    category: 'Прием врача',
    duration: '30'
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/services')
      const data = await res.json()
      if (Array.isArray(data)) setServices(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service)
      setFormData({
        code: service.code,
        name: service.name,
        price: service.price.toString(),
        category: service.category,
        duration: service.duration.toString()
      })
    } else {
      setEditingService(null)
      setFormData({
        code: `SRV-${Math.floor(1000 + Math.random() * 9000)}`,
        name: '',
        price: '',
        category: 'Прием врача',
        duration: '30'
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration)
    }

    try {
      const url = editingService ? `/api/services/${editingService.id}` : '/api/services'
      const method = editingService ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setShowModal(false)
        fetchServices()
      } else {
        const error = await res.json()
        alert('Ошибка: ' + (error.error || 'Не удалось сохранить услугу'))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту услугу?')) return
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      if (res.ok) fetchServices()
    } catch (e) {
      console.error(e)
    }
  }

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="text-primary w-6 h-6" />
            Справочник Услуг (Прайс-лист)
          </h2>
          <p className="text-sm text-slate-500 mt-1">Управление каталогом медицинских услуг и цен</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition"
        >
          <Plus size={16} /> Новая услуга
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input 
          type="text" 
          placeholder="Поиск по названию, коду или категории..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500 text-sm">Загрузка прайс-листа...</div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Код</th>
                <th className="p-3">Название услуги</th>
                <th className="p-3">Категория</th>
                <th className="p-3">Длительность</th>
                <th className="p-3 font-bold">Стоимость</th>
                <th className="p-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500 italic">Услуги не найдены</td>
                </tr>
              ) : (
                filteredServices.map(service => (
                  <tr key={service.id} className="hover:bg-slate-50/50 transition group">
                    <td className="p-3 font-mono text-xs text-slate-500">{service.code}</td>
                    <td className="p-3 font-medium text-slate-900">{service.name}</td>
                    <td className="p-3 text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 rounded-md text-xs font-semibold">{service.category}</span>
                    </td>
                    <td className="p-3 text-slate-600">{service.duration} мин.</td>
                    <td className="p-3 font-bold text-slate-900">{service.price.toLocaleString()} ₽</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button 
                          onClick={() => handleOpenModal(service)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Редактировать"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(service.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Удалить"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 mb-4 pb-3 border-b border-slate-100">
              {editingService ? 'Редактировать услугу' : 'Создать новую услугу'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Код услуги</label>
                  <input 
                    type="text" required 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Категория</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none"
                  >
                    <option value="Прием врача">Прием врача</option>
                    <option value="Диагностика (УЗИ/ЭКГ)">Диагностика (УЗИ/ЭКГ)</option>
                    <option value="Лаборатория">Лаборатория</option>
                    <option value="Процедуры">Процедуры</option>
                    <option value="Косметология">Косметология</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Наименование</label>
                <input 
                  type="text" required 
                  placeholder="Например, Первичный прием кардиолога"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Стоимость (₽)</label>
                  <input 
                    type="number" required min="0" step="100"
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Длительность (мин)</label>
                  <input 
                    type="number" required min="5" step="5"
                    value={formData.duration} 
                    onChange={e => setFormData({...formData, duration: e.target.value})}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold shadow transition"
                >
                  {editingService ? 'Сохранить изменения' : 'Создать услугу'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
