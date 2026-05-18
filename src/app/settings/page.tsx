'use client'

import React from 'react'
import { Settings, Shield, Bell, MessageCircle, Database, HelpCircle, Save, LogOut, Share2 } from 'lucide-react'
import TemplateManager from '@/components/TemplateManager'
import TelegramAuth from '@/components/TelegramAuth'

export default function SettingsPage() {
  const [activeSection, setActiveSection] = React.useState('TEMPLATES')
  
  // Chatwoot settings state
  const [cwUrl, setCwUrl] = React.useState('')
  const [cwAccountId, setCwAccountId] = React.useState('')
  const [cwToken, setCwToken] = React.useState('')
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (activeSection === 'MESSENGERS') {
      fetch('/api/settings/chatwoot')
        .then(res => res.json())
        .then(data => {
          if (data) {
            setCwUrl(data.baseUrl || '')
            setCwAccountId(data.accountId || '')
            setCwToken(data.apiToken || '')
          }
        })
        .catch(console.error)
    }
  }, [activeSection])

  const handleSaveChatwoot = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/settings/chatwoot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: cwUrl, accountId: cwAccountId, apiToken: cwToken })
      })
      if (res.ok) {
        alert('Настройки Chatwoot успешно сохранены!')
      } else {
        alert('Ошибка при сохранении настроек.')
      }
    } catch (e) {
      console.error(e)
      alert('Ошибка сети.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="app-layout">
      <aside className="sidebar glass-card">
        <div className="logo">
          <div className="logo-icon">K</div>
          <span className="logo-text">Klinika</span>
        </div>
        
        <nav className="sidebar-nav">
          <a href="/" className="nav-item"><MessageCircle size={20} /> Чат и пациенты</a>
          <a href="#" className={`nav-item ${activeSection === 'TEMPLATES' ? 'active' : ''}`} onClick={() => setActiveSection('TEMPLATES')}><Database size={20} /> Шаблоны</a>
          <a href="#" className={`nav-item ${activeSection === 'MESSENGERS' ? 'active' : ''}`} onClick={() => setActiveSection('MESSENGERS')}><Settings size={20} /> Мессенджеры</a>
          <a href="#" className={`nav-item ${activeSection === 'TD_SYNC' ? 'active' : ''}`} onClick={() => setActiveSection('TD_SYNC')}><Share2 size={20} /> Синхронизация</a>
          <a href="#" className={`nav-item ${activeSection === 'SECURITY' ? 'active' : ''}`} onClick={() => setActiveSection('SECURITY')}><Shield size={20} /> Безопасность</a>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn"><LogOut size={18} /> Выход</button>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <h3>Настройки системы</h3>
        </header>

        <div className="settings-content">
          {activeSection === 'TEMPLATES' && <TemplateManager />}

          {activeSection === 'TD_SYNC' && <TelegramAuth />}

          {activeSection === 'MESSENGERS' && (
            <div className="settings-section glass-card">
              <h4>Интеграция Chatwoot</h4>
              <p className="text-sm text-slate-500 mb-4">Настройте подключение к вашему серверу Chatwoot для агрегации всех мессенджеров (Telegram, WhatsApp, Instagram) в едином окне CRM.</p>
              
              <div className="form-group">
                <label>Chatwoot Base URL</label>
                <input type="text" placeholder="https://app.chatwoot.com" value={cwUrl} onChange={e => setCwUrl(e.target.value)} />
                <span className="field-hint">Адрес вашего сервера Chatwoot или облачной версии.</span>
              </div>
              <div className="form-group">
                <label>Account ID</label>
                <input type="text" placeholder="Например: 1" value={cwAccountId} onChange={e => setCwAccountId(e.target.value)} />
                <span className="field-hint">ID вашего аккаунта (можно найти в URL панели управления Chatwoot).</span>
              </div>
              <div className="form-group">
                <label>API Access Token</label>
                <input type="password" placeholder="••••••••••••••••••••" value={cwToken} onChange={e => setCwToken(e.target.value)} />
                <span className="field-hint">Ваш личный токен доступа (Profile Settings -{'>'} Access Token).</span>
              </div>
              
              <div className="webhook-info mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h5 className="text-sm font-semibold text-blue-800 mb-2">Настройка Webhook</h5>
                <p className="text-xs text-blue-600">Скопируйте этот URL и добавьте его в настройки Webhook в вашем Chatwoot (выберите событие <b>message_created</b>):</p>
                <code className="block mt-2 p-2 bg-white rounded text-xs text-slate-700 border border-slate-200">
                  https://[ваш-домен]/api/chatwoot/webhook
                </code>
              </div>

              <button className="btn-save mt-4" onClick={handleSaveChatwoot} disabled={isSaving}>
                <Save size={16} /> {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
              </button>
            </div>
          )}

          {activeSection === 'SECURITY' && (
            <div className="settings-section glass-card">
              <h4>Безопасность и доступ</h4>
              <p>Управление ролями и двухфакторной аутентификацией для сотрудников клиники.</p>
              <div className="security-option">
                <span>Двухфакторная аутентификация (2FA)</span>
                <div className="toggle-switch active"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .app-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          min-height: 100vh;
          background: #f8fafc;
        }

        .sidebar {
          margin: 1rem;
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          border-radius: 2rem;
          height: calc(100vh - 2rem);
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          text-decoration: none;
          color: var(--text-secondary);
          border-radius: 1rem;
          transition: all 0.2s;
          font-weight: 500;
        }

        .nav-item:hover, .nav-item.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
        }

        .main-content {
          padding: 2rem 3rem;
        }

        .top-header {
          margin-bottom: 2rem;
        }

        .top-header h3 {
          font-size: 1.75rem;
          font-family: 'Outfit', sans-serif;
          color: var(--text-main);
        }

        .settings-section {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .settings-section h4 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .form-group input {
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          outline: none;
        }

        .field-hint {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .btn-save {
          align-self: flex-start;
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .security-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 0.75rem;
        }

        .toggle-switch {
          width: 48px;
          height: 24px;
          background: #cbd5e1;
          border-radius: 999px;
          position: relative;
          cursor: pointer;
        }

        .toggle-switch.active {
          background: var(--success);
        }

        .toggle-switch::after {
          content: '';
          position: absolute;
          left: 4px;
          top: 4px;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
        }

        .toggle-switch.active::after {
          transform: translateX(24px);
        }
      `}</style>
    </main>
  )
}
