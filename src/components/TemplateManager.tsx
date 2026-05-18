'use client'

import React from 'react'
import { FileText, Plus, Trash2, Edit2, Save, X } from 'lucide-react'

interface Template {
  id: string
  name: string
  content: string
}

export default function TemplateManager() {
  const [templates, setTemplates] = React.useState<Template[]>([
    { id: '1', name: 'Напоминание о приеме', content: 'Здравствуйте, {{name}}! Напоминаем вам о записи на {{date}} в {{time}}. Ждем вас!' },
    { id: '2', name: 'Приветствие нового пациента', content: 'Добро пожаловать в Klinika, {{name}}! Мы получили ваши данные и готовы записать вас на прием.' },
    { id: '3', name: 'Запрос результатов', content: '{{name}}, добрый день! Пришлите, пожалуйста, результаты ваших последних анализов для карты.' }
  ])
  const [isAdding, setIsAdding] = React.useState(false)
  const [newTemplate, setNewTemplate] = React.useState({ name: '', content: '' })

  const handleAdd = () => {
    if (newTemplate.name && newTemplate.content) {
      setTemplates([...templates, { ...newTemplate, id: Date.now().toString() }])
      setNewTemplate({ name: '', content: '' })
      setIsAdding(false)
    }
  }

  const handleDelete = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id))
  }

  return (
    <div className="template-manager glass-card">
      <div className="section-header">
        <h4><FileText size={18} /> Шаблоны сообщений</h4>
        <button className="add-btn" onClick={() => setIsAdding(true)}><Plus size={16} /></button>
      </div>

      <div className="templates-list">
        {isAdding && (
          <div className="template-edit-card glass-card">
            <input 
              type="text" 
              placeholder="Название шаблона" 
              value={newTemplate.name}
              onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
            />
            <textarea 
              placeholder="Текст сообщения (используйте {{name}}, {{date}}...)" 
              value={newTemplate.content}
              onChange={e => setNewTemplate({...newTemplate, content: e.target.value})}
            />
            <div className="edit-actions">
              <button className="btn-save" onClick={handleAdd}><Save size={14} /> Сохранить</button>
              <button className="btn-cancel" onClick={() => setIsAdding(false)}><X size={14} /> Отмена</button>
            </div>
          </div>
        )}

        {templates.map(t => (
          <div key={t.id} className="template-item">
            <div className="template-info">
              <div className="template-name">{t.name}</div>
              <div className="template-content">{t.content}</div>
            </div>
            <div className="template-actions">
              <button className="icon-btn"><Edit2 size={16} /></button>
              <button className="icon-btn delete" onClick={() => handleDelete(t.id)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .template-manager {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .section-header h4 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.1rem;
          color: var(--text-main);
        }

        .add-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.4rem;
          border-radius: 0.5rem;
          cursor: pointer;
        }

        .templates-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .template-item {
          padding: 1rem;
          background: #f8fafc;
          border-radius: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border: 1px solid #f1f5f9;
          transition: all 0.2s;
        }

        .template-item:hover {
          background: white;
          border-color: var(--primary);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .template-name {
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--text-main);
          margin-bottom: 0.4rem;
        }

        .template-content {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .template-actions {
          display: flex;
          gap: 0.5rem;
        }

        .icon-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.4rem;
          border-radius: 0.4rem;
        }

        .icon-btn:hover { background: #f1f5f9; color: var(--primary); }
        .icon-btn.delete:hover { background: #fee2e2; color: #ef4444; }

        .template-edit-card {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          border: 1px solid var(--primary);
        }

        .template-edit-card input, .template-edit-card textarea {
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          font-size: 0.9rem;
          outline: none;
        }

        .template-edit-card textarea {
          min-height: 80px;
          resize: vertical;
        }

        .edit-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-save {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .btn-cancel {
          background: #f1f5f9;
          color: var(--text-secondary);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
