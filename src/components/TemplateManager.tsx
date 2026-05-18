'use client'

import React, { useEffect, useState } from 'react'
import { FileText, Plus, Trash2, Edit2, Save, X, RotateCw, Check } from 'lucide-react'

interface Template {
  id: string
  name: string
  content: string
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form states
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '' })
  const [editTemplate, setEditTemplate] = useState({ name: '', content: '' })
  
  // Loading status for actions
  const [actionLoading, setActionLoading] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      } else {
        showToast('Ошибка при загрузке шаблонов', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('Ошибка сети при загрузке', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  const handleAdd = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) {
      showToast('Заполните все поля шаблона', 'error')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      })

      if (res.ok) {
        const created = await res.json()
        setTemplates(prev => [...prev, created])
        setNewTemplate({ name: '', content: '' })
        setIsAdding(false)
        showToast('Шаблон успешно добавлен!', 'success')
      } else {
        showToast('Не удалось создать шаблон', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('Ошибка сети', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartEdit = (template: Template) => {
    setEditingId(template.id)
    setEditTemplate({ name: template.name, content: template.content })
  }

  const handleSaveEdit = async (id: string) => {
    if (!editTemplate.name.trim() || !editTemplate.content.trim()) {
      showToast('Заполните все поля шаблона', 'error')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editTemplate)
      })

      if (res.ok) {
        const updated = await res.json()
        setTemplates(prev => prev.map(t => (t.id === id ? updated : t)))
        setEditingId(null)
        showToast('Шаблон успешно обновлен!', 'success')
      } else {
        showToast('Не удалось обновить шаблон', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('Ошибка сети', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы действительно хотите удалить этот шаблон?')) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id))
        showToast('Шаблон удален', 'success')
      } else {
        showToast('Не удалось удалить шаблон', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('Ошибка сети', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="template-manager glass-card">
      {/* Dynamic Notification Toast */}
      {notification && (
        <div className={`toast-notification ${notification.type}`}>
          {notification.type === 'success' ? <Check size={16} /> : <X size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="section-header">
        <h4>
          <FileText size={20} className="header-icon" /> 
          Шаблоны сообщений 
          <span className="count-badge">{templates.length}</span>
        </h4>
        <button 
          className={`add-btn ${isAdding ? 'active' : ''}`} 
          onClick={() => {
            setIsAdding(!isAdding)
            setEditingId(null)
          }}
          disabled={loading}
          title="Добавить новый шаблон"
        >
          {isAdding ? <X size={18} /> : <Plus size={18} />}
        </button>
      </div>

      <div className="templates-list">
        {/* ADD NEW FORM CARD */}
        {isAdding && (
          <div className="template-edit-card glass-card add-mode animate-fade-in">
            <div className="card-subheader">Новый быстрый шаблон</div>
            <input 
              type="text" 
              placeholder="Название шаблона (например: Памятка пациенту)" 
              value={newTemplate.name}
              onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
              disabled={actionLoading}
            />
            <textarea 
              placeholder="Текст сообщения. Используйте {{name}} для автоматической подстановки имени пациента, а также {{date}}, {{time}} для настраиваемых параметров." 
              value={newTemplate.content}
              onChange={e => setNewTemplate({...newTemplate, content: e.target.value})}
              disabled={actionLoading}
            />
            <div className="edit-actions">
              <button className="btn-save" onClick={handleAdd} disabled={actionLoading}>
                {actionLoading ? <RotateCw size={14} className="spinner" /> : <Save size={14} />} 
                Сохранить
              </button>
              <button className="btn-cancel" onClick={() => setIsAdding(false)} disabled={actionLoading}>
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* LOADING SKELETONS */}
        {loading ? (
          <div className="skeleton-container">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-card glass-card">
                <div className="skeleton-title"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text short"></div>
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="empty-templates glass-card">
            <FileText size={32} />
            <p>У вас пока нет созданных шаблонов сообщений.</p>
          </div>
        ) : (
          templates.map(t => (
            <div key={t.id} className={`template-item-wrapper ${editingId === t.id ? 'editing' : ''}`}>
              {editingId === t.id ? (
                /* INLINE EDIT MODE CARD */
                <div className="template-edit-card glass-card animate-fade-in">
                  <div className="card-subheader">Редактирование шаблона</div>
                  <input 
                    type="text" 
                    placeholder="Название шаблона" 
                    value={editTemplate.name}
                    onChange={e => setEditTemplate({...editTemplate, name: e.target.value})}
                    disabled={actionLoading}
                  />
                  <textarea 
                    placeholder="Текст сообщения..." 
                    value={editTemplate.content}
                    onChange={e => setEditTemplate({...editTemplate, content: e.target.value})}
                    disabled={actionLoading}
                  />
                  <div className="edit-actions">
                    <button className="btn-save" onClick={() => handleSaveEdit(t.id)} disabled={actionLoading}>
                      {actionLoading ? <RotateCw size={14} className="spinner" /> : <Save size={14} />} 
                      Сохранить
                    </button>
                    <button className="btn-cancel" onClick={() => setEditingId(null)} disabled={actionLoading}>
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                /* STANDARD VIEW MODE CARD */
                <div className="template-item glass-card animate-fade-in">
                  <div className="template-info">
                    <div className="template-name">{t.name}</div>
                    <div className="template-content">
                      {t.content.split(/(\{\{[a-zA-Z0-9_]+\}\})/).map((chunk, idx) => {
                        if (chunk.startsWith('{{') && chunk.endsWith('}}')) {
                          return <span key={idx} className="parameter-pill">{chunk}</span>
                        }
                        return chunk
                      })}
                    </div>
                  </div>
                  <div className="template-actions">
                    <button 
                      className="icon-btn" 
                      onClick={() => handleStartEdit(t)}
                      title="Редактировать шаблон"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="icon-btn delete" 
                      onClick={() => handleDelete(t.id)}
                      title="Удалить шаблон"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .template-manager {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          position: relative;
          background: rgba(255, 255, 255, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(16px);
          border-radius: 1.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
        }

        /* --- Toast Notification --- */
        .toast-notification {
          position: fixed;
          top: 2rem;
          right: 2rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-radius: 1rem;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          z-index: 2100;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(12px);
          animation: slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .toast-notification.success {
          background: rgba(16, 185, 129, 0.9);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .toast-notification.error {
          background: rgba(239, 68, 68, 0.9);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .section-header h4 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-main);
          font-family: 'Outfit', sans-serif;
        }

        .header-icon {
          color: var(--primary);
        }

        .count-badge {
          font-size: 0.75rem;
          padding: 0.2rem 0.5rem;
          background: rgba(37, 99, 235, 0.1);
          color: var(--primary);
          border-radius: 999px;
          font-weight: 700;
        }

        .add-btn {
          background: var(--primary);
          color: white;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
        }

        .add-btn:hover {
          transform: scale(1.05);
          background: var(--primary-hover);
          box-shadow: 0 6px 14px rgba(37, 99, 235, 0.3);
        }

        .add-btn.active {
          background: #ef4444;
          box-shadow: 0 4px 10px rgba(239, 68, 68, 0.2);
        }

        .add-btn.active:hover {
          background: #dc2626;
        }

        .templates-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .template-item {
          padding: 1.25rem 1.5rem;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(241, 245, 249, 0.8);
          border-radius: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .template-item:hover {
          background: white;
          border-color: rgba(37, 99, 235, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.03);
        }

        .template-name {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }

        .template-content {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .parameter-pill {
          display: inline-block;
          font-size: 0.75rem;
          padding: 0.05rem 0.4rem;
          background: rgba(37, 99, 235, 0.08);
          color: var(--primary);
          border: 1px solid rgba(37, 99, 235, 0.15);
          border-radius: 6px;
          margin: 0 0.2rem;
          font-family: monospace;
          font-weight: 600;
        }

        .template-actions {
          display: flex;
          gap: 0.4rem;
          margin-left: 1.5rem;
        }

        .icon-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .icon-btn:hover { 
          background: #f1f5f9; 
          color: var(--primary); 
        }

        .icon-btn.delete:hover { 
          background: #fee2e2; 
          color: #ef4444; 
        }

        /* --- Editing Cards --- */
        .template-edit-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          background: white;
          border: 1px solid rgba(37, 99, 235, 0.3);
          border-radius: 1.25rem;
          box-shadow: 0 15px 30px rgba(37, 99, 235, 0.05);
        }

        .template-edit-card.add-mode {
          background: rgba(255, 255, 255, 0.8);
          border-color: rgba(37, 99, 235, 0.25);
        }

        .card-subheader {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .template-edit-card input, .template-edit-card textarea {
          padding: 0.85rem 1rem;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s;
          background: #f8fafc;
        }

        .template-edit-card input:focus, .template-edit-card textarea:focus {
          border-color: var(--primary);
          background: white;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
        }

        .template-edit-card textarea {
          min-height: 100px;
          resize: vertical;
          line-height: 1.5;
        }

        .edit-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-save {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.65rem 1.25rem;
          border-radius: 0.75rem;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .btn-save:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
        }

        .btn-cancel {
          background: #f1f5f9;
          color: var(--text-secondary);
          border: none;
          padding: 0.65rem 1.25rem;
          border-radius: 0.75rem;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel:hover {
          background: #e2e8f0;
          color: var(--text-main);
        }

        .empty-templates {
          padding: 3rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.5);
          border-radius: 1rem;
        }

        .empty-templates p {
          font-size: 0.9rem;
          font-style: italic;
        }

        /* --- Skeletons Loading --- */
        .skeleton-container {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .skeleton-card {
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .skeleton-title {
          height: 16px;
          width: 35%;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.5s infinite;
          border-radius: 4px;
        }

        .skeleton-text {
          height: 12px;
          width: 90%;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: skeletonShimmer 1.5s infinite;
          border-radius: 4px;
        }

        .skeleton-text.short {
          width: 60%;
        }

        @keyframes skeletonShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* --- Animations --- */
        .animate-fade-in {
          animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
