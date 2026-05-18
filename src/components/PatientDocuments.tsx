'use client'

import React from 'react'
import { FileText, Download, Trash2, FileImage, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Document {
  id: string
  name: string
  type: 'PDF' | 'IMAGE'
  size: string
  date: string | Date
}

interface PatientDocumentsProps {
  medical: {
    documents: Document[]
    history: { date: string; desc: string }[]
  }
  onUpdate: (updated: any) => void
}

export default function PatientDocuments({ medical, onUpdate }: PatientDocumentsProps) {
  const [showModal, setShowModal] = React.useState(false)

  // Form states
  const [docName, setDocName] = React.useState('')
  const [docType, setDocType] = React.useState<'PDF' | 'IMAGE'>('PDF')
  const [docSize, setDocSize] = React.useState('')

  const documents = medical.documents || []

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault()
    if (!docName.trim()) return

    const today = new Date().toLocaleDateString('ru-RU')
    const finalSize = docSize.trim() ? (docSize.toLowerCase().endsWith('mb') || docSize.toLowerCase().endsWith('kb') ? docSize : `${docSize} KB`) : '1.2 MB'
    
    const newDoc: Document = {
      id: Date.now().toString(),
      name: docName.includes('.') ? docName : `${docName}.${docType.toLowerCase()}`,
      type: docType,
      size: finalSize,
      date: new Date()
    }

    const updated = {
      ...medical,
      documents: [...documents, newDoc],
      history: [
        {
          date: today,
          desc: `Загружен новый медицинский документ: "${newDoc.name}" (${finalSize}).`
        },
        ...(medical.history || [])
      ]
    }

    onUpdate(updated)
    setDocName('')
    setDocSize('')
    setShowModal(false)
  }

  const handleDeleteDocument = (docId: string) => {
    const today = new Date().toLocaleDateString('ru-RU')
    const targetDoc = documents.find(d => d.id === docId)
    if (!targetDoc) return

    const confirmed = window.confirm(`Вы уверены, что хотите удалить документ "${targetDoc.name}"?`)
    if (!confirmed) return

    const updatedDocs = documents.filter(d => d.id !== docId)
    const updated = {
      ...medical,
      documents: updatedDocs,
      history: [
        {
          date: today,
          desc: `Удален документ: "${targetDoc.name}".`
        },
        ...(medical.history || [])
      ]
    }

    onUpdate(updated)
  }

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
        <button className="btn-primary-small" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Загрузить
        </button>
      </div>

      <div className="docs-list">
        {documents.length > 0 ? (
          documents.map(doc => {
            const dateObj = new Date(doc.date)
            return (
              <div key={doc.id} className="doc-item">
                <div className="doc-icon">{getIcon(doc.type)}</div>
                <div className="doc-info">
                  <div className="doc-name">{doc.name}</div>
                  <div className="doc-meta">
                    {doc.size} • {format(dateObj, 'dd MMM yyyy', { locale: ru })}
                  </div>
                </div>
                <div className="doc-actions">
                  <button className="action-btn" onClick={() => alert(`Загрузка файла "${doc.name}" начата...`)} title="Скачать файл">
                    <Download size={18} />
                  </button>
                  <button className="action-btn delete" onClick={() => handleDeleteDocument(doc.id)} title="Удалить файл">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <p className="no-data">Медицинские документы отсутствуют</p>
        )}
      </div>

      {/* --- ADD DOCUMENT MODAL --- */}
      {showModal && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-content glass-card">
            <div className="sub-modal-header">
              <h3>Загрузить новый документ</h3>
              <button className="sub-close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddDocument} className="sub-modal-form">
              <div className="sub-form-group">
                <label>Название документа</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Например, Результаты УЗИ сердца"
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                />
              </div>
              <div className="form-grid">
                <div className="sub-form-group">
                  <label>Тип файла</label>
                  <select value={docType} onChange={e => setDocType(e.target.value as any)}>
                    <option value="PDF">Документ PDF (.pdf)</option>
                    <option value="IMAGE">Изображение (.jpg, .png)</option>
                  </select>
                </div>
                <div className="sub-form-group">
                  <label>Размер (размер файла)</label>
                  <input 
                    type="text" 
                    placeholder="Например, 1.2 MB или 450 KB"
                    value={docSize}
                    onChange={e => setDocSize(e.target.value)}
                  />
                </div>
              </div>
              <div className="sub-modal-footer">
                <button type="button" className="sub-btn-sec" onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className="sub-btn-prim">Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}

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

        .no-data {
          font-size: 0.85rem;
          color: var(--text-secondary);
          text-align: center;
          padding: 2rem;
          font-style: italic;
        }

        /* --- SUB-MODAL STYLING --- */
        .sub-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease-out;
        }

        .sub-modal-content {
          width: 400px;
          padding: 1.5rem;
          background: white;
          border-radius: 1.25rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .sub-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
        }

        .sub-modal-header h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .sub-close-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.4rem;
        }

        .sub-close-btn:hover {
          background: #f1f5f9;
        }

        .sub-modal-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .sub-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .sub-form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .sub-form-group input, .sub-form-group select {
          padding: 0.6rem 0.8rem;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          outline: none;
          font-size: 0.9rem;
        }

        .sub-form-group input:focus, .sub-form-group select:focus {
          border-color: var(--primary);
        }

        .sub-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .sub-btn-sec {
          padding: 0.5rem 1rem;
          background: #f1f5f9;
          border: none;
          color: var(--text-secondary);
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }

        .sub-btn-prim {
          padding: 0.5rem 1rem;
          background: var(--primary);
          border: none;
          color: white;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }

        .sub-btn-prim:hover {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  )
}
