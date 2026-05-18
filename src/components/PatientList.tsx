import React from 'react'
import { User, Search, Plus } from 'lucide-react'
import AddPatientModal from './AddPatientModal'

interface PatientSummary {
  id: string
  firstName: string
  lastName: string
  phone: string
  messages: { isRead: boolean; isIncoming: boolean }[]
}

interface PatientListProps {
  patients: PatientSummary[]
  selectedId: string
  onSelect: (id: string) => void
  onPatientAdded: (patient: any) => void
}

export default function PatientList({ patients, selectedId, onSelect, onPatientAdded }: PatientListProps) {
  const [search, setSearch] = React.useState('')
  const [showModal, setShowModal] = React.useState(false)

  const filteredPatients = patients.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  )

  return (
    <div className="patient-list-container">
      <div className="list-actions">
        <button className="add-patient-btn" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Новый пациент
        </button>
      </div>

      <div className="patient-search">
        <Search size={18} />
        <input 
          type="text" 
          placeholder="Поиск..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showModal && (
        <AddPatientModal 
          onClose={() => setShowModal(false)} 
          onSuccess={onPatientAdded} 
        />
      )}
      
      <div className="patient-items">
        {filteredPatients.map(p => (
          <div 
            key={p.id} 
            className={`patient-item ${selectedId === p.id ? 'active' : ''}`}
            onClick={() => onSelect(p.id)}
          >
            <div className="item-avatar">
              <User size={16} />
            </div>
            <div className="item-info">
              <div className="item-name">{p.lastName} {p.firstName}</div>
              <div className="item-phone">{p.phone}</div>
            </div>
            {p.messages.filter(m => m.isIncoming && !m.isRead).length > 0 && (
              <div className="unread-badge">
                {p.messages.filter(m => m.isIncoming && !m.isRead).length}
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .patient-list-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: 100%;
        }

        .add-patient-btn {
          width: 100%;
          padding: 0.75rem;
          background: rgba(37, 99, 235, 0.1);
          color: var(--primary);
          border: 1px dashed var(--primary);
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .add-patient-btn:hover {
          background: var(--primary);
          color: white;
          border-style: solid;
        }

        .patient-search {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 0.75rem;
          border: 1px solid var(--border);
        }

        .patient-search input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.9rem;
          width: 100%;
        }

        .patient-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          overflow-y: auto;
          max-height: 400px;
        }

        .patient-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .patient-item:hover {
          background: rgba(37, 99, 235, 0.05);
        }

        .patient-item.active {
          background: var(--primary);
          color: white;
        }

        .item-avatar {
          width: 32px;
          height: 32px;
          background: #e2e8f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }

        .patient-item.active .item-avatar {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .item-info {
          display: flex;
          flex-direction: column;
        }

        .item-name {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .item-phone {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .unread-badge {
          margin-left: auto;
          background: #ef4444;
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
        }
      `}</style>
    </div>
  )
}
