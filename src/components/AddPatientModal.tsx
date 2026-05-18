'use client'

import React from 'react'
import { X, UserPlus, Phone, Mail, Send } from 'lucide-react'

interface AddPatientModalProps {
  onClose: () => void
  onSuccess: (patient: any) => void
}

export default function AddPatientModal({ onClose, onSuccess }: AddPatientModalProps) {
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    telegramId: '',
    maxId: ''
  })
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/patient/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (res.ok) {
        onSuccess(data)
        onClose()
      } else {
        setError(data.error || 'Произошла ошибка при создании пациента')
      }
    } catch (err) {
      setError('Ошибка сети')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card">
        <div className="modal-header">
          <h3><UserPlus size={20} /> Новый пациент</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-grid">
            <div className="form-group">
              <label>Имя</label>
              <input 
                type="text" 
                required 
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Фамилия</label>
              <input 
                type="text" 
                required 
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
          </div>

          <div className="form-group">
            <label><Phone size={14} /> Телефон</label>
            <input 
              type="tel" 
              required 
              placeholder="+7 (___) ___-__-__"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label><Mail size={14} /> Email (необязательно)</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="messenger-setup">
            <h4><Send size={14} /> Мессенджеры</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Telegram ID/Username</label>
                <input 
                  type="text" 
                  placeholder="ivan_petrov"
                  value={formData.telegramId}
                  onChange={e => setFormData({...formData, telegramId: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Max ID (телефон)</label>
                <input 
                  type="text" 
                  placeholder="79991234567"
                  value={formData.maxId}
                  onChange={e => setFormData({...formData, maxId: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Создание...' : 'Добавить пациента'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
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
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-content {
          width: 500px;
          padding: 2rem;
          background: white;
          border-radius: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }

        .modal-header h3 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
          color: var(--text-main);
        }

        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #f1f5f9;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-main);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .form-group input {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          border-color: var(--primary);
        }

        .messenger-setup {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 1rem;
          border: 1px solid var(--border);
          margin: 0.5rem 0;
        }

        .messenger-setup h4 {
          font-size: 0.85rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--text-main);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .btn-secondary {
          padding: 0.75rem 1.5rem;
          background: #f1f5f9;
          border: none;
          border-radius: 0.75rem;
          color: var(--text-main);
          font-weight: 500;
          cursor: pointer;
        }

        .error-message {
          padding: 0.75rem;
          background: #fee2e2;
          color: #ef4444;
          border-radius: 0.75rem;
          font-size: 0.85rem;
          text-align: center;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
