'use client'

import React from 'react'
import { Bell, MessageSquare, Calendar, X, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Notification {
  id: string
  title: string
  message: string
  type: 'MESSAGE' | 'APPOINTMENT'
  timestamp: Date
  read: boolean
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = React.useState<Notification[]>([
    { 
      id: '1', 
      title: 'Новое сообщение', 
      message: 'Иван Петров прислал результаты анализов.', 
      type: 'MESSAGE', 
      timestamp: new Date(Date.now() - 1000 * 60 * 5), 
      read: false 
    },
    { 
      id: '2', 
      title: 'Напоминание о приеме', 
      message: 'Завтра в 10:00 прием у Марии Сидоровой.', 
      type: 'APPOINTMENT', 
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), 
      read: true 
    }
  ])
  const [isOpen, setIsOpen] = React.useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="notification-wrapper">
      <button className="bell-btn" onClick={() => setIsOpen(!isOpen)}>
        <Bell size={20} />
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown glass-card">
          <div className="dropdown-header">
            <h4>Уведомления</h4>
            <button className="close-btn" onClick={() => setIsOpen(false)}><X size={16} /></button>
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-state">Нет новых уведомлений</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'}`}>
                  <div className={`notification-icon ${n.type.toLowerCase()}`}>
                    {n.type === 'MESSAGE' ? <MessageSquare size={16} /> : <Calendar size={16} />}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{n.title}</div>
                    <div className="notification-message">{n.message}</div>
                    <div className="notification-time">
                      {formatDistanceToNow(n.timestamp, { addSuffix: true, locale: ru })}
                    </div>
                  </div>
                  {!n.read && <div className="unread-dot" />}
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="dropdown-footer">
              <button className="mark-all-btn">
                <Check size={14} /> Отметить все как прочитанные
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .notification-wrapper {
          position: relative;
        }

        .bell-btn {
          background: white;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          padding: 0.6rem;
          border-radius: 0.75rem;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }

        .bell-btn:hover {
          background: #f1f5f9;
          color: var(--primary);
          border-color: var(--primary);
        }

        .unread-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ef4444;
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          min-width: 16px;
          height: 16px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }

        .notification-dropdown {
          position: absolute;
          top: calc(100% + 0.75rem);
          right: 0;
          width: 320px;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          z-index: 100;
          overflow: hidden;
          animation: dropdownIn 0.2s ease-out;
        }

        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-header {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dropdown-header h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .notification-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .notification-item {
          padding: 1rem;
          display: flex;
          gap: 1rem;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: background 0.2s;
          position: relative;
        }

        .notification-item:hover {
          background: #f8fafc;
        }

        .notification-item.unread {
          background: rgba(37, 99, 235, 0.02);
        }

        .notification-icon {
          width: 32px;
          height: 32px;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notification-icon.message { background: rgba(37, 99, 235, 0.1); color: var(--primary); }
        .notification-icon.appointment { background: rgba(16, 185, 129, 0.1); color: var(--success); }

        .notification-content {
          flex: 1;
        }

        .notification-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.2rem;
        }

        .notification-message {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-bottom: 0.4rem;
        }

        .notification-time {
          font-size: 0.75rem;
          color: var(--text-secondary);
          opacity: 0.8;
        }

        .unread-dot {
          width: 8px;
          height: 8px;
          background: var(--primary);
          border-radius: 50%;
          position: absolute;
          right: 1rem;
          top: 1.25rem;
        }

        .dropdown-footer {
          padding: 0.75rem;
          background: #f8fafc;
          border-top: 1px solid var(--border);
        }

        .mark-all-btn {
          width: 100%;
          background: transparent;
          border: none;
          color: var(--primary);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }

        .empty-state {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  )
}
