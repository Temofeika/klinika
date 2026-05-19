'use client'

import React from 'react'
import { Settings, Shield, Bell, MessageCircle, Database, HelpCircle, Save, LogOut, Share2 } from 'lucide-react'
import TemplateManager from '@/components/TemplateManager'
import TelegramAuth from '@/components/TelegramAuth'

export default function SettingsPage() {
  const [activeSection, setActiveSection] = React.useState('TEMPLATES')
  
  // Doctor/Auth check state
  const [activeDoctor, setActiveDoctor] = React.useState<any>(null)
  const [loadingDoctor, setLoadingDoctor] = React.useState(true)

  // Telegram settings state
  const [tgBotToken, setTgBotToken] = React.useState('')
  const [origin, setOrigin] = React.useState('https://[ваш-домен]')
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    fetch('/api/doctors')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const savedDoctorId = typeof window !== 'undefined' ? localStorage.getItem('activeDoctorId') : null
          const saved = savedDoctorId ? data.find((d: any) => d.id === savedDoctorId) : null
          setActiveDoctor(saved || data[0])
        }
        setLoadingDoctor(false)
      })
      .catch(err => {
        console.error(err)
        setLoadingDoctor(false)
      })
  }, [])

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  React.useEffect(() => {
    if (activeSection === 'MESSENGERS') {
      fetch('/api/settings/telegram')
        .then(res => res.json())
        .then(data => {
          if (data) {
            setTgBotToken(data.telegramBotToken || '')
          }
        })
        .catch(console.error)
    }
  }, [activeSection])

  const handleSaveTelegram = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/settings/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramBotToken: tgBotToken })
      })
      if (res.ok) {
        alert('Настройки Telegram-бота успешно сохранены! Вебхук зарегистрирован.')
      } else {
        alert('Ошибка при сохранении настроек бота.')
      }
    } catch (e) {
      console.error(e)
      alert('Ошибка сети.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loadingDoctor) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#64748b' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Проверка прав доступа...</p>
        </div>
      </div>
    )
  }

  if (activeDoctor?.position !== 'Администратор системы') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', fontFamily: 'sans-serif', padding: '1rem' }}>
        <div style={{ maxWidth: '480px', padding: '2.5rem', borderRadius: '1.25rem', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>
          <div style={{ background: '#fef2f2', color: '#ef4444', width: '3.5rem', height: '3.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Shield size={32} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>Доступ ограничен</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Раздел настроек системы доступен исключительно для <strong>Администратора системы</strong>. 
            Ваша текущая роль: <strong>{activeDoctor ? activeDoctor.position : 'Врач'}</strong>.
          </p>
          <a href="/" style={{ display: 'inline-block', padding: '0.75rem 1.75rem', background: '#2563eb', color: 'white', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', transition: 'background 0.2s' }}>
            Вернуться на дашборд
          </a>
        </div>
      </div>
    )
  }

  return (
    <main className="app-layout">
      <aside className="sidebar glass-card">
        <div className="logo">
          <div className="logo-icon">P</div>
          <span className="logo-text">PlanetaMed</span>
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
            <div className="messengers-container">
              {/* Telegram Bot (Direct Connection) */}
              <div className="settings-section glass-card">
                <h4>Telegram-бот (Напрямую — Рекомендуется)</h4>
                <p className="text-sm text-slate-500 mb-4">
                  Подключите Telegram-бота вашей клиники напрямую. Пациенты смогут писать боту, а вы будете отвечать прямо из этой CRM. 
                  <b> Без включенного ПК, без VPN и без сторонних сервисов!</b>
                </p>
                
                <div className="form-group">
                  <label>Telegram Bot Token</label>
                  <input 
                    type="text" 
                    placeholder="Например: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ" 
                    value={tgBotToken} 
                    onChange={e => setTgBotToken(e.target.value)} 
                  />
                  <span className="field-hint">
                    Токен вашего бота. Чтобы получить его бесплатно за 10 секунд:
                    <ol style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                      <li>Откройте Telegram, найдите официального бота <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}>@BotFather</a></li>
                      <li>Отправьте команду <code className="bg-slate-100 p-0.5 rounded text-red-500 font-mono">/newbot</code> и следуйте инструкциям</li>
                      <li>Скопируйте полученный HTTP API Token и вставьте его сюда.</li>
                    </ol>
                  </span>
                </div>

                <div className="webhook-info p-4 bg-emerald-50 rounded-lg border border-emerald-100" style={{ backgroundColor: '#ecfdf5', borderColor: '#d1fae5', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #d1fae5' }}>
                  <h5 className="text-sm font-semibold text-emerald-800 mb-2" style={{ color: '#065f46', fontWeight: 600 }}>Авто-настройка</h5>
                  <p className="text-xs text-emerald-600" style={{ color: '#047857', fontSize: '0.8rem' }}>
                    При сохранении токена CRM <b>автоматически</b> пропишет безопасный Webhook для вашего бота. Бот моментально начнет принимать сообщения и выводить их в вашу CRM!
                  </p>
                </div>

                <button className="btn-save mt-2" onClick={handleSaveTelegram} disabled={isSaving} style={{ backgroundColor: '#10b981' }}>
                  <Save size={16} /> {isSaving ? 'Сохранение...' : 'Сохранить и активировать бота'}
                </button>
              </div>

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

        .messengers-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
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
