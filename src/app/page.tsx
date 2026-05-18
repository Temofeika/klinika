'use client'

import { useState, useEffect } from 'react'
import PatientCard from '@/components/PatientCard'
import PatientList from '@/components/PatientList'
import NotificationCenter from '@/components/NotificationCenter'
import { LayoutDashboard, Users, Calendar, Settings, LogOut, MessageCircle, Activity, TrendingUp } from 'lucide-react'

export default function Home() {
  const [patient, setPatient] = useState<any>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPatients: 0,
    messagesToday: 12,
    activeMessenger: 'Telegram'
  })

  const [initialLoaded, setInitialLoaded] = useState(false)

  // 1. Initial Load: Fetch patients list, set default active patient
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const res = await fetch('/api/patient')
        const data = await res.json()
        setPatients(data)
        setStats(prev => ({ ...prev, totalPatients: data.length }))
        
        if (data.length > 0) {
          await handleSelectPatient(data[0].id)
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to load initial data:', err)
        setLoading(false)
      } finally {
        setInitialLoaded(true)
      }
    }
    loadInitialData()
  }, [])

  // 2. Poll patients list every 3 seconds to get unread badges & new patients
  useEffect(() => {
    if (!initialLoaded) return

    const pollPatientsList = async () => {
      try {
        const res = await fetch('/api/patient')
        const data = await res.json()
        setPatients(data)
        setStats(prev => ({ ...prev, totalPatients: data.length }))
      } catch (err) {
        console.error('Failed to poll patients list:', err)
      }
    }

    const interval = setInterval(pollPatientsList, 3000)
    return () => clearInterval(interval)
  }, [initialLoaded])

  // 3. Poll active selected patient details to receive chat messages in real time
  useEffect(() => {
    if (!patient?.id) return

    const pollActivePatient = async () => {
      try {
        const res = await fetch(`/api/patient?id=${patient.id}`)
        const data = await res.json()
        
        // Prevent state refresh if messages list didn't change to save DOM performance
        if (JSON.stringify(data.messages) !== JSON.stringify(patient.messages)) {
          setPatient(data)
        }
      } catch (err) {
        console.error('Failed to poll active patient details:', err)
      }
    }

    const interval = setInterval(pollActivePatient, 3000)
    return () => clearInterval(interval)
  }, [patient?.id, patient?.messages])

  const handleSelectPatient = async (id: string) => {
    try {
      // Mark as read
      await fetch('/api/patient/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: id })
      })

      // Update local patients list to clear badge
      setPatients(prev => prev.map(p => 
        p.id === id ? { ...p, messages: p.messages.map((m: any) => ({ ...m, isRead: true })) } : p
      ))

      const res = await fetch(`/api/patient?id=${id}`)
      const data = await res.json()
      setPatient(data)
    } catch (err) {
      console.error('Failed to fetch patient details:', err)
    }
  }

  const handlePatientAdded = (newPatient: any) => {
    setPatients([...patients, newPatient])
    handleSelectPatient(newPatient.id)
  }

  if (loading && !patient) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter' }}>
        <p>Загрузка данных пациента...</p>
      </div>
    )
  }

  return (
    <main className="app-layout">
      <aside className="sidebar glass-card">
        <div className="logo">
          <div className="logo-icon">K</div>
          <span className="logo-text">Klinika</span>
        </div>
        
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active"><LayoutDashboard size={20} /> Дашборд</a>
          <a href="/settings" className="nav-item"><Settings size={20} /> Настройки</a>
          <div className="sidebar-divider"></div>
          <div className="sidebar-section-label">Пациенты</div>
          <PatientList 
            patients={patients} 
            selectedId={patient?.id} 
            onSelect={handleSelectPatient} 
            onPatientAdded={handlePatientAdded}
          />
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">AD</div>
            <div className="user-info">
              <span className="user-name">Admin</span>
              <span className="user-role">Врач</span>
            </div>
          </div>
          <button className="logout-btn"><LogOut size={18} /></button>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <div className="search-bar">
            <input type="text" placeholder="Поиск пациентов, записей..." />
          </div>
          <div className="header-notifications">
            <NotificationCenter />
          </div>
        </header>

        <section className="stats-summary">
          <div className="stat-card glass-card">
            <div className="stat-icon blue"><Users size={20} /></div>
            <div className="stat-info">
              <div className="stat-label">Всего пациентов</div>
              <div className="stat-value">{stats.totalPatients}</div>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-icon green"><MessageCircle size={20} /></div>
            <div className="stat-info">
              <div className="stat-label">Сообщений сегодня</div>
              <div className="stat-value">{stats.messagesToday}</div>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-icon purple"><TrendingUp size={20} /></div>
            <div className="stat-info">
              <div className="stat-label">Топ платформа</div>
              <div className="stat-value">{stats.activeMessenger}</div>
            </div>
          </div>
        </section>

        {patient && <PatientCard patient={patient as any} />}
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
          position: sticky;
          top: 1rem;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 3rem;
          padding-left: 0.5rem;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);
        }

        .logo-text {
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
          overflow-y: auto;
          margin-right: -0.5rem;
          padding-right: 0.5rem;
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

        .nav-item:hover {
          background: rgba(37, 99, 235, 0.05);
          color: var(--primary);
        }

        .nav-item.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
        }

        .sidebar-divider {
          height: 1px;
          background: var(--border);
          margin: 1rem 0;
          opacity: 0.5;
        }

        .sidebar-section-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          font-weight: 700;
          margin-bottom: 0.75rem;
          padding-left: 0.5rem;
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: #e2e8f0;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .logout-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        .main-content {
          padding: 1rem 2rem;
        }

        .top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding: 1rem 0;
        }

        .search-bar input {
          width: 400px;
          padding: 0.75rem 1.5rem;
          background: white;
          border: 1px solid var(--border);
          border-radius: 1rem;
          outline: none;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          transition: all 0.2s;
        }

        .search-bar input:focus {
          border-color: var(--primary);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .stats-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          transition: all 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.blue { background: rgba(37, 99, 235, 0.1); color: var(--primary); }
        .stat-icon.green { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .stat-icon.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }

        .stat-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-main);
          font-family: 'Outfit', sans-serif;
        }
      `}</style>
    </main>
  )
}
