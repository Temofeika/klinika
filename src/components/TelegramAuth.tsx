'use client'

import React from 'react'
import { Phone, Lock, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react'

export default function TelegramAuth() {
  const [method, setMethod] = React.useState<'QR' | 'PHONE'>('QR')
  const [step, setStep] = React.useState<'IDLE' | 'SCANNING' | 'CODE' | 'SUCCESS' | 'ERROR'>('IDLE')
  const [errorMsg, setErrorMsg] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleStartAuth = () => {
    setLoading(true)
    setErrorMsg('')
    setTimeout(() => {
      setLoading(false)
      setStep(method === 'QR' ? 'SCANNING' : 'CODE')
    }, 1500)
  }

  return (
    <div className="telegram-auth-container glass-card">
      <div className="auth-tabs">
        <button 
          className={`tab-btn ${method === 'QR' ? 'active' : ''}`}
          onClick={() => { setMethod('QR'); setStep('IDLE'); setErrorMsg(''); }}
        >
          QR-код
        </button>
        <button 
          className={`tab-btn ${method === 'PHONE' ? 'active' : ''}`}
          onClick={() => { setMethod('PHONE'); setStep('IDLE'); setErrorMsg(''); }}
        >
          Номер телефона
        </button>
      </div>

      <div className="auth-body">
        {step === 'IDLE' && (
          <div className="auth-intro">
            <div className="icon-wrapper">
              <ShieldCheck size={32} />
            </div>
            <h4>Синхронизация аккаунта</h4>
            <p>Выберите способ авторизации для подключения ваших личных переписок к CRM.</p>
            <button className="btn-auth main" onClick={handleStartAuth} disabled={loading}>
              {loading ? <RefreshCw className="spin" size={18} /> : 'Начать подключение'}
            </button>
          </div>
        )}

        {step === 'SCANNING' && (
          <div className="qr-step">
            <div className="qr-placeholder">
              <div className="qr-box">
                <div className="qr-corner top-left"></div>
                <div className="qr-corner top-right"></div>
                <div className="qr-corner bottom-left"></div>
                <div className="qr-corner bottom-right"></div>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=tg://login?token=production_token" alt="QR Code" />
              </div>
            </div>
            <div className="qr-instructions">
              <ol>
                <li>Откройте Telegram на телефоне</li>
                <li>Перейдите в <b>Настройки</b> &gt; <b>Устройства</b></li>
                <li>Нажмите <b>Подключить устройство</b></li>
              </ol>
            </div>
            <button className="btn-cancel-small" onClick={() => setStep('IDLE')}>Отмена</button>
          </div>
        )}

        {step === 'CODE' && (
          <div className="phone-step">
            <div className="input-group">
              <label><Phone size={16} /> Номер телефона</label>
              <input 
                type="tel" 
                placeholder="+7 (___) ___-__-__" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <button className="btn-auth" onClick={() => setStep('SUCCESS')}>
              Отправить запрос <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div className="auth-success">
            <CheckCircle2 size={48} color="var(--success)" />
            <h5>Аккаунт подключен!</h5>
            <p>Синхронизация личных сообщений запущена.</p>
          </div>
        )}

        {step === 'ERROR' && (
          <div className="auth-error">
            <div className="error-icon">!</div>
            <h5>Ошибка авторизации</h5>
            <p className="error-text">{errorMsg}</p>
            <button className="btn-auth" onClick={handleStartAuth}>Попробовать снова</button>
            <button className="btn-cancel-small" onClick={() => setStep('IDLE')}>Отмена</button>
          </div>
        )}
      </div>

      <style jsx>{`
        .telegram-auth-container {
          padding: 2rem;
          max-width: 500px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .auth-tabs {
          display: flex;
          background: #f1f5f9;
          padding: 0.4rem;
          border-radius: 0.75rem;
          gap: 0.4rem;
        }

        .auth-tabs .tab-btn {
          flex: 1;
          padding: 0.6rem;
          border: none;
          background: transparent;
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-secondary);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .auth-tabs .tab-btn.active {
          background: white;
          color: var(--primary);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .icon-wrapper {
          width: 64px;
          height: 64px;
          background: rgba(37, 99, 235, 0.1);
          color: var(--primary);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }

        .auth-intro h4 {
          font-size: 1.25rem;
          margin-bottom: 0.75rem;
          text-align: center;
        }

        .auth-intro p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
          text-align: center;
          line-height: 1.5;
        }

        .qr-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .qr-box {
          padding: 1.5rem;
          background: white;
          border-radius: 1rem;
          position: relative;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .qr-corner {
          position: absolute;
          width: 20px;
          height: 20px;
          border: 3px solid var(--primary);
        }

        .top-left { top: 10px; left: 10px; border-right: 0; border-bottom: 0; }
        .top-right { top: 10px; right: 10px; border-left: 0; border-bottom: 0; }
        .bottom-left { bottom: 10px; left: 10px; border-right: 0; border-top: 0; }
        .bottom-right { bottom: 10px; right: 10px; border-left: 0; border-top: 0; }

        .qr-instructions ol {
          text-align: left;
          font-size: 0.9rem;
          color: var(--text-main);
          padding-left: 1.25rem;
          line-height: 1.8;
        }

        .btn-auth {
          width: 100%;
          background: var(--primary);
          color: white;
          padding: 1rem;
          border: none;
          border-radius: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          text-align: left;
        }

        .input-group label {
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .input-group input {
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          font-size: 1.1rem;
          outline: none;
          width: 100%;
        }

        .btn-cancel-small {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.85rem;
          cursor: pointer;
        }

        .auth-error {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding: 1rem 0;
        }

        .error-icon {
          width: 48px;
          height: 48px;
          background: #fee2e2;
          color: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .error-text {
          font-size: 0.9rem;
          color: #ef4444;
          background: #fff5f5;
          padding: 0.75rem;
          border-radius: 0.5rem;
          width: 100%;
        }

        .auth-success {
          text-align: center;
          padding: 2rem 0;
        }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
