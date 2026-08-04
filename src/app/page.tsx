'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import ScheduleGrid from '@/components/ScheduleGrid'
import PatientCard from '@/components/PatientCard'
import DoctorDashboard from '@/components/DoctorDashboard'
import LabDashboard from '@/components/LabDashboard'
import BillingDashboard from '@/components/BillingDashboard'
import AddPatientModal from '@/components/AddPatientModal'
import AdminServices from '@/components/AdminServices'
import ReportsDashboard from '@/components/ReportsDashboard'
import WarehouseDashboard from '@/components/WarehouseDashboard'
import AdminDoctors from '@/components/AdminDoctors'

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('schedule')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [patient, setPatient] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [currentRole, setCurrentRole] = useState('Врач')
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch patient details when selectedPatientId changes
  useEffect(() => {
    if (!selectedPatientId) return

    const fetchPatient = async () => {
      try {
        const res = await fetch(`/api/patient?id=${selectedPatientId}`)
        const data = await res.json()
        setPatient(data)
        setActiveTab('patients')
      } catch (e) {
        console.error(e)
      }
    }
    fetchPatient()
  }, [selectedPatientId])

  const handlePatientAdded = (newPatient: any) => {
    setSelectedPatientId(newPatient.id)
    setShowAddModal(false)
    setActiveTab('patients')
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab)
          if (tab !== 'patients') setSelectedPatientId(null)
        }}
        unreadCount={unreadCount}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onSearchChange={(q) => setSearchQuery(q)}
          onOpenAddPatient={() => setShowAddModal(true)}
          currentRole={currentRole}
          setCurrentRole={setCurrentRole}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50">
          {activeTab === 'schedule' && (
            <ScheduleGrid
              onSelectPatient={(id) => setSelectedPatientId(id)}
            />
          )}

          {activeTab === 'patients' && (
            <div className="p-6">
              {patient ? (
                <PatientCard patient={patient} currentRole={currentRole} />
              ) : (
                <DoctorDashboard
                  onSelectPatient={(id) => setSelectedPatientId(id)}
                  onAddPatient={() => setShowAddModal(true)}
                />
              )}
            </div>
          )}

          {activeTab === 'labs' && (
            <LabDashboard />
          )}

          {activeTab === 'billing' && (
            <BillingDashboard />
          )}

          {activeTab === 'reports' && (
            <ReportsDashboard />
          )}

          {activeTab === 'chat' && (
            <div className="p-6">
              <DoctorDashboard
                onSelectPatient={(id) => setSelectedPatientId(id)}
                onAddPatient={() => setShowAddModal(true)}
              />
            </div>
          )}

          {activeTab === 'warehouse' && (
            <WarehouseDashboard />
          )}

          {activeTab === 'admin' && (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-xl font-bold text-slate-900">Администрирование МИС "Клиника"</h2>
                <p className="text-sm text-slate-500">
                  Управление правами доступа, ролями сотрудников, справочниками и интеграциями МИС (Аналог Medialog 8.10.8).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-sm text-slate-800">Статус СУБД</span>
                    <p className="text-xs text-emerald-600 font-semibold mt-1">● Подключено (Prisma / Postgres)</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-sm text-slate-800">Интеграция Telegram</span>
                    <p className="text-xs text-blue-600 font-semibold mt-1">● Webhook Активен</p>
                  </div>
                </div>
              </div>

              <AdminServices />
              <AdminDoctors />
            </div>
          )}
        </main>
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handlePatientAdded}
        />
      )}
    </div>
  )
}
