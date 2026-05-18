'use client'

import React from 'react'
import { FileText, Download, Trash2, FileImage, FileCode, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Document {
  id: string
  name: string
  type: string
  size: string
  date: Date
}

export default function PatientDocuments() {
  const [documents, setDocuments] = React.useState<Document[]>([
    { id: '1', name: 'Анализ крови.pdf', type: 'PDF', size: '1.2 MB', date: new Date(Date.now() - 86400000 * 2) },
    { id: '2', name: 'Рентген грудной клетки.jpg', type: 'IMAGE', size: '3.5 MB', date: new Date(Date.now() - 86400000 * 5) },
    { id: '3', name: 'Выписка из стационара.pdf', type: 'PDF', size: '0.8 MB', date: new Date(Date.now() - 86400000 * 10) }
  ])

  const getIcon = (type: string) => {
    switch (type) {
      case 'IMAGE': return <FileImage size={24} className="icon-image" />
      default: return <FileText size={24} className="icon-pdf" />
    }
  }

  return (
    <div className="documents-container">
      <div className="docs-header">
        <h3>Документы пациента</h3>
        <button className="btn-primary-small"><Plus size={16} /> Загрузить</button>
      </div>

      <div className="docs-list">
        {documents.map(doc => (
          <div key={doc.id} className="doc-item">
            <div className="doc-icon">{getIcon(doc.type)}</div>
            <div className="doc-info">
              <div className="doc-name">{doc.name}</div>
              <div className="doc-meta">
                {doc.size} • {format(doc.date, 'dd MMM yyyy', { locale: ru })}
              </div>
            </div>
            <div className="doc-actions">
              <button className="action-btn"><Download size={18} /></button>
              <button className="action-btn delete"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .documents-container {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: 100%;
        }

        .docs-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .docs-header h3 {
          font-size: 1.1rem;
          color: var(--text-main);
        }

        .btn-primary-small {
          padding: 0.5rem 1rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .docs-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .doc-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid var(--border);
          border-radius: 1rem;
          transition: all 0.2s;
        }

        .doc-item:hover {
          background: white;
          border-color: var(--primary);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .doc-icon {
          width: 48px;
          height: 48px;
          background: white;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
        }

        .icon-pdf { color: #ef4444; }
        .icon-image { color: #3b82f6; }

        .doc-info {
          flex: 1;
        }

        .doc-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }

        .doc-meta {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .doc-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #f1f5f9;
          color: var(--primary);
        }

        .action-btn.delete:hover {
          background: #fee2e2;
          color: #ef4444;
        }
      `}</style>
    </div>
  )
}
