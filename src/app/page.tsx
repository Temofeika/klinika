'use client'

import { useState, useEffect } from 'react'
import PatientCard from '@/components/PatientCard'
import PatientList from '@/components/PatientList'
import NotificationCenter from '@/components/NotificationCenter'
import AddPatientModal from '@/components/AddPatientModal'
import { LayoutDashboard, Users, Settings, LogOut, MessageCircle, TrendingUp, ChevronDown, User, ShieldAlert, Check } from 'lucide-react'

export default function Home() {
  const [patient, setPatient] = useState<any>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [stats, setStats] = useState({
    totalPatients: 0,
    messagesToday: 12,
    activeMessenger: 'Telegram'
  })

  // Doctor States
  const [doctors, setDoctors] = useState<any[]>([])
  const [activeDoctor, setActiveDoctor] = useState<any>(null)
  const [showDocMenu, setShowDocMenu] = useState(false)
  const [seeding, setSeeding] = useState(false)

  // 1. Initial Load: Fetch doctors registry
  useEffect(() => {
    const loadDoctorsRegistry = async () => {
      try {
        const res = await fetch('/api/doctors')
        const data = await res.json()
        if (res.ok && Array.isArray(data)) {
          setDoctors(data)
          if (data.length > 0) {
            setActiveDoctor(data[0]) // Default to first doctor
          } else {
            setLoading(false)
          }
        } else {
          console.error('Failed to load doctors:', data.error || 'Invalid response')
          setDoctors([])
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to load doctors:', err)
        setDoctors([])
        setLoading(false)
      }
    }
    loadDoctorsRegistry()
  }, [])

  // 2. Fetch patients list whenever active doctor changes
  useEffect(() => {
    if (!activeDoctor?.id) return

    const loadDoctorPatients = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/patient?doctorId=${activeDoctor.id}`)
        const data = await res.json()
        setPatients(data)
        setStats(prev => ({ ...prev, totalPatients: data.length }))
        
        // Auto-select first patient of this doctor
        if (data.length > 0) {
          await handleSelectPatient(data[0].id)
        } else {
          setPatient(null)
        }
      } catch (err) {
        console.error('Failed to fetch patients list:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDoctorPatients()
  }, [activeDoctor?.id])

  // 3. Poll patients list every 3 seconds to get unread badges & new patient alerts
  useEffect(() => {
    if (!activeDoctor?.id) return

    const pollPatientsList = async () => {
      try {
        const res = await fetch(`/api/patient?doctorId=${activeDoctor.id}`)
        const data = await res.json()
        
        // Check if length or IDs changed to avoid layout recalculations
        if (JSON.stringify(data.map((p: any) => p.id)) !== JSON.stringify(patients.map(p => p.id))) {
          setPatients(data)
          setStats(prev => ({ ...prev, totalPatients: data.length }))
        }
      } catch (err) {
        console.error('Failed to poll patients list:', err)
      }
    }

    const interval = setInterval(pollPatientsList, 3000)
    return () => clearInterval(interval)
  }, [activeDoctor?.id, patients])

  // 4. Poll active selected patient details to receive chat messages in real time
  useEffect(() => {
    if (!patient?.id) return

    const pollActivePatient = async () => {
      try {
        const res = await fetch(`/api/patient?id=${patient.id}`)
        const data = await res.json()
        
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
      // Mark messages as read
      await fetch('/api/patient/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: id })
      })

      // Clear local unread badges immediately
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
    setPatients(prev => [...prev, newPatient])
    handleSelectPatient(newPatient.id)
  }

  // Trigger Dynamic database seeding helper
  const handleSeedDatabase = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/settings/seed')
      const data = await res.json()
      if (data.success) {
        setDoctors(data.doctors)
        if (data.doctors.length > 0) {
          setActiveDoctor(data.doctors[0])
        }
      } else {
        alert('Ошибка при заполнении: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Ошибка при обращении к серверу симуляции.')
    } finally {
      setSeeding(false)
    }
  }

  // Empty state: Database needs seeding (no doctors populated)
  if (doctors.length === 0 && !loading) {
    return (
      <div className="empty-db-wrapper">
        <div className="empty-db-card glass-card">
          <ShieldAlert size={48} className="warn-icon" />
          <h2>Многопользовательский режим не инициализирован</h2>
          <p>В базе данных Supabase PostgreSQL отсутствуют записи о врачах. Нажмите кнопку ниже, чтобы запустить автоматическое наполнение демонстрационными врачами и разделенными пациентами.</p>
          <button className="seed-btn" onClick={handleSeedDatabase} disabled={seeding}>
            {seeding ? 'Создание учетных записей...' : 'Инициализировать врачей и пациентов'}
          </button>
        </div>
        <style jsx>{`
          .empty-db-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: radial-gradient(circle at top right, #eff6ff, #f8fafc);
            font-family: 'Inter', sans-serif;
            padding: 2rem;
          }
          .empty-db-card {
            width: 480px;
            padding: 2.5rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.25rem;
            border-radius: 1.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
          }
          .warn-icon { color: var(--primary); margin-bottom: 0.5rem; }
          .empty-db-card h2 { font-size: 1.35rem; font-weight: 700; color: var(--text-main); }
          .empty-db-card p { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; }
          .seed-btn {
            width: 100%;
            padding: 0.85rem 1.5rem;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .seed-btn:hover { background: #1d4ed8; }
        `}</style>
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
          <a href="#" className="nav-item active"><LayoutDashboard size={20} /> Дашборд</a>
          <a href="/settings" className="nav-item"><Settings size={20} /> Настройки</a>
          <div className="sidebar-divider"></div>
          <div className="sidebar-section-label">Мои пациенты</div>
          <PatientList 
            patients={patients} 
            selectedId={patient?.id} 
            onSelect={handleSelectPatient} 
            onAddClick={() => setShowAddModal(true)}
          />
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {activeDoctor ? `${activeDoctor.firstName[0]}${activeDoctor.lastName[0]}` : 'AD'}
            </div>
            <div className="user-info">
              <span className="user-name">
                {activeDoctor ? `${activeDoctor.firstName} ${activeDoctor.lastName}` : 'Загрузка...'}
              </span>
              <span className="user-role">
                {activeDoctor ? activeDoctor.position : 'Врач'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <div className="search-bar">
            <input type="text" placeholder="Поиск пациентов, записей..." />
          </div>

          <div className="header-actions">
            {/* --- DOCTOR DROPDOWN SELECTOR --- */}
            <div className="doctor-selector-wrapper">
              <button className="doctor-dropdown-btn glass-card" onClick={() => setShowDocMenu(!showDocMenu)}>
                <User size={16} className="user-icon" />
                <span className="doc-btn-text">
                  {activeDoctor ? `${activeDoctor.firstName} ${activeDoctor.lastName} (${activeDoctor.position})` : 'Выбор врача'}
                </span>
                <ChevronDown size={14} className="chevron" />
              </button>

              {showDocMenu && (
                <div className="doctor-dropdown-menu glass-card">
                  <div className="menu-header">Сменить учетную запись врача</div>
                  {Array.isArray(doctors) && doctors.map(doc => (
                    <div 
                      key={doc.id} 
                      className={`doctor-menu-item ${activeDoctor?.id === doc.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveDoctor(doc)
                        setShowDocMenu(false)
                      }}
                    >
                      <div className="doc-avatar-small">{doc.firstName[0]}{doc.lastName[0]}</div>
                      <div className="doc-details-small">
                        <strong>{doc.firstName} {doc.lastName}</strong>
                        <span>{doc.position}</span>
                      </div>
                      {activeDoctor?.id === doc.id && <Check size={16} className="check-icon" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="header-notifications">
              <NotificationCenter />
            </div>
          </div>
        </header>

        <section className="stats-summary">
          <div className="stat-card glass-card">
            <div className="stat-icon blue"><Users size={20} /></div>
            <div className="stat-info">
              <div className="stat-label">Мои пациенты</div>
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

        {loading ? (
          <div className="dashboard-loading">
            <p>Синхронизация профилей пациентов...</p>
          </div>
        ) : patient ? (
          <PatientCard patient={patient as any} doctorId={activeDoctor?.id} />
        ) : (
          <div className="empty-workspace glass-card">
            <Users size={32} />
            <p>У данного врача пока нет назначенных пациентов. Нажмите «Добавить нового» в меню слева для регистрации.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddPatientModal 
          onClose={() => setShowAddModal(false)} 
          onSuccess={handlePatientAdded} 
          doctorId={activeDoctor?.id}
        />
      )}

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
          width: 320px;
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

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        /* --- DOCTOR SELECTOR STYLES --- */
        .doctor-selector-wrapper {
          position: relative;
        }

        .doctor-dropdown-btn {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem 1.25rem;
          background: white;
          border: 1px solid var(--border);
          border-radius: 1rem;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-main);
          transition: all 0.2s;
        }

        .doctor-dropdown-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .user-icon {
          color: var(--text-secondary);
        }

        .doctor-dropdown-menu {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          width: 320px;
          background: white;
          border-radius: 1.25rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          z-index: 1500;
          overflow: hidden;
          animation: slideDown 0.2s ease-out;
        }

        .menu-header {
          padding: 0.75rem 1rem;
          background: #f8fafc;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          border-bottom: 1px solid var(--border);
        }

        .doctor-menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 1px solid #f1f5f9;
        }

        .doctor-menu-item:last-child {
          border-bottom: none;
        }

        .doctor-menu-item:hover {
          background: #f8fafc;
        }

        .doctor-menu-item.active {
          background: rgba(37, 99, 235, 0.05);
        }

        .doc-avatar-small {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.75rem;
        }

        .doc-details-small {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .doc-details-small strong {
          font-size: 0.85rem;
          color: var(--text-main);
        }

        .doc-details-small span {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .check-icon {
          color: var(--primary);
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

        .dashboard-loading {
          padding: 5rem 0;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.95rem;
          font-style: italic;
        }

        .empty-workspace {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 5rem 2rem;
          text-align: center;
          border-radius: 1.5rem;
          color: var(--text-secondary);
        }

        .empty-workspace p {
          max-width: 450px;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  )
}
