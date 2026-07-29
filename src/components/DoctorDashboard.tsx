import React, { useEffect, useState } from 'react';
import { Users, MessageCircle, FileText, UserPlus, Link, AlertCircle, Clock, Activity, FileDigit } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DoctorDashboardProps {
  activeDoctor: any;
  onSelectPatient: (id: string) => void;
  onAddPatient: () => void;
  lastDbUpdate: number;
}

export default function DoctorDashboard({ activeDoctor, onSelectPatient, onAddPatient, lastDbUpdate }: DoctorDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeDoctor?.id) return;
    
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/dashboard?doctorId=${activeDoctor.id}`);
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error('Failed to fetch dashboard stats', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    
  }, [activeDoctor?.id, lastDbUpdate]);

  if (loading) {
    return (
      <div className="dashboard-loading-view">
        <Activity className="spinner-icon" size={32} />
        <p>Загрузка сводки...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header">
        <h1>Сводка за сегодня</h1>
        <p>Добро пожаловать, {activeDoctor?.firstName}! Вот что требует вашего внимания.</p>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card glass-card">
          <div className="kpi-icon blue"><Users size={24} /></div>
          <div className="kpi-data">
            <span className="kpi-label">Активные пациенты</span>
            <span className="kpi-value">{stats.totalPatients}</span>
          </div>
        </div>
        
        <div className="kpi-card glass-card">
          <div className="kpi-icon orange"><MessageCircle size={24} /></div>
          <div className="kpi-data">
            <span className="kpi-label">Новые сообщения</span>
            <span className="kpi-value">{stats.unreadMessagesCount}</span>
          </div>
        </div>
        
        <div className="kpi-card glass-card">
          <div className="kpi-icon green"><FileDigit size={24} /></div>
          <div className="kpi-data">
            <span className="kpi-label">События за сегодня</span>
            <span className="kpi-value">{stats.recentMessages?.length || 0}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        <div className="main-col">
          <div className="dashboard-section glass-card">
            <div className="section-header">
              <AlertCircle size={20} className="section-icon text-orange" />
              <h2>Требуют ответа</h2>
            </div>
            
            <div className="needing-response-list">
              {stats.patientsNeedingResponse?.length > 0 ? (
                stats.patientsNeedingResponse.map((p: any) => (
                  <div key={p.id} className="priority-patient-item" onClick={() => onSelectPatient(p.id)}>
                    <div className="priority-avatar">{p.firstName[0]}{p.lastName[0]}</div>
                    <div className="priority-details">
                      <strong>{p.firstName} {p.lastName}</strong>
                      <span className="priority-msg">
                        {p.messages?.[0]?.content?.includes('Фото:') || p.messages?.[0]?.content?.includes('Документ:') 
                          ? '📎 Прикреплен файл' 
                          : (p.messages?.[0]?.content?.substring(0, 40) + '...')}
                      </span>
                    </div>
                    <div className="priority-time">
                      <Clock size={12} />
                      {format(new Date(p.messages?.[0]?.timestamp || p.lastMessageAt), 'HH:mm')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-list">
                  <span className="emoji">🎉</span>
                  <p>Отличная работа! Всем пациентам отвечено.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="dashboard-section glass-card">
            <div className="section-header">
              <Activity size={20} className="section-icon text-blue" />
              <h2>Недавняя активность</h2>
            </div>
            <div className="activity-feed">
              {stats.recentMessages?.length > 0 ? (
                stats.recentMessages.map((msg: any) => (
                  <div key={msg.id} className="feed-item">
                    <div className="feed-indicator"></div>
                    <div className="feed-content">
                      <p>
                        <strong>{msg.patient.firstName} {msg.patient.lastName}</strong>{' '}
                        {msg.content?.includes('Фото:') || msg.content?.includes('Документ:') 
                          ? 'прикрепил(а) файл' 
                          : 'отправил(а) сообщение'}
                      </p>
                      <span className="feed-time">
                        {format(new Date(msg.timestamp), 'd MMM, HH:mm', { locale: ru })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-list">
                  <p>Пока нет новых событий</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="side-col">
          <div className="dashboard-section glass-card">
            <div className="section-header">
              <FileText size={20} className="section-icon text-purple" />
              <h2>Быстрые действия</h2>
            </div>
            
            <div className="quick-actions-list">
              <button className="quick-action-btn" onClick={onAddPatient}>
                <div className="qa-icon-wrapper blue"><UserPlus size={18} /></div>
                <span>Добавить пациента</span>
              </button>
              
              <button className="quick-action-btn" onClick={() => {
                alert('Используйте эту ссылку, чтобы пациенты перешли в бот:\nhttps://t.me/ИМЯ_ВАШЕГО_БОТА');
              }}>
                <div className="qa-icon-wrapper purple"><Link size={18} /></div>
                <span>Ссылка на Telegram-бота</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          padding: 1rem 1rem 3rem 1rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .dashboard-loading-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          color: var(--primary);
        }
        .spinner-icon {
          animation: spin 2s linear infinite;
          margin-bottom: 1rem;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .dashboard-header {
          margin-bottom: 2rem;
        }
        .dashboard-header h1 {
          font-family: 'Outfit', sans-serif;
          font-size: 2rem;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }
        .dashboard-header p {
          color: var(--text-secondary);
          font-size: 1.05rem;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .kpi-card {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          border-radius: 1.25rem;
        }
        .kpi-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .kpi-icon.blue { background: rgba(37,99,235,0.1); color: var(--primary); }
        .kpi-icon.orange { background: rgba(249,115,22,0.1); color: #f97316; }
        .kpi-icon.green { background: rgba(16,185,129,0.1); color: var(--success); }
        
        .kpi-data { display: flex; flex-direction: column; }
        .kpi-label { font-size: 0.85rem; color: var(--text-secondary); font-weight: 500; }
        .kpi-value { font-size: 2rem; font-weight: 700; color: var(--text-main); line-height: 1.2; font-family: 'Outfit', sans-serif; }

        .dashboard-content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }
        .main-col { display: flex; flex-direction: column; gap: 1.5rem; }
        .side-col { display: flex; flex-direction: column; gap: 1.5rem; }

        .dashboard-section {
          padding: 1.5rem;
          border-radius: 1.25rem;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }
        .section-header h2 { font-size: 1.1rem; font-weight: 700; color: var(--text-main); }
        .text-orange { color: #f97316; }
        .text-blue { color: var(--primary); }
        .text-purple { color: #8b5cf6; }

        .priority-patient-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 1rem;
          margin-bottom: 0.75rem;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .priority-patient-item:hover {
          background: white;
          border-color: var(--primary);
          box-shadow: 0 4px 6px -1px rgba(37,99,235,0.1);
        }
        .priority-avatar {
          width: 42px; height: 42px;
          background: #fee2e2; color: #ef4444;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
        }
        .priority-details { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
        .priority-details strong { font-size: 0.95rem; color: var(--text-main); }
        .priority-msg { font-size: 0.85rem; color: var(--text-secondary); }
        .priority-time { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: #f97316; font-weight: 600; }

        .activity-feed {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .feed-item {
          display: flex;
          gap: 1rem;
          position: relative;
        }
        .feed-indicator {
          width: 10px;
          height: 10px;
          background: var(--primary);
          border-radius: 50%;
          margin-top: 5px;
        }
        .feed-item::before {
          content: '';
          position: absolute;
          left: 4px; top: 15px; bottom: -20px;
          width: 2px;
          background: #e2e8f0;
        }
        .feed-item:last-child::before { display: none; }
        .feed-content p { font-size: 0.9rem; color: var(--text-main); line-height: 1.4; margin-bottom: 0.2rem; }
        .feed-time { font-size: 0.75rem; color: var(--text-secondary); }

        .empty-state-list {
          text-align: center;
          padding: 2rem;
          color: var(--text-secondary);
        }
        .empty-state-list .emoji { font-size: 2rem; display: block; margin-bottom: 0.5rem; }

        .quick-actions-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .quick-action-btn {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: 1rem;
          cursor: pointer;
          font-weight: 600;
          color: var(--text-main);
          transition: all 0.2s;
          text-align: left;
        }
        .quick-action-btn:hover {
          background: white;
          border-color: var(--primary);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          color: var(--primary);
        }
        .qa-icon-wrapper {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .qa-icon-wrapper.blue { background: rgba(37,99,235,0.1); color: var(--primary); }
        .qa-icon-wrapper.purple { background: rgba(139,92,246,0.1); color: #8b5cf6; }
      `}</style>
    </div>
  );
}
