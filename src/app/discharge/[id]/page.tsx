'use client'

import React, { useEffect, useState, use } from 'react'
import { FileText, Printer, ShieldAlert, ArrowLeft, Calendar, User, Phone, CheckCircle, Mail } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function DischargePage({ params }: PageProps) {
  const { id: patientId } = use(params)
  
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const res = await fetch(`/api/patient?id=${patientId}`)
        if (!res.ok) {
          throw new Error('Не удалось загрузить данные пациента')
        }
        const data = await res.json()
        setPatient(data)
      } catch (err: any) {
        console.error('Error fetching patient:', err)
        setError(err.message || 'Произошла ошибка при загрузке документа')
      } finally {
        setLoading(false)
      }
    }

    fetchPatientData()
  }, [patientId])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Загрузка официального медицинского бланка...</p>
        <style jsx>{`
          .loader-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #f8fafc;
            color: #64748b;
            font-family: 'Inter', system-ui, sans-serif;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #2563eb;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="error-container">
        <ShieldAlert size={48} className="error-icon" />
        <h2>Документ не найден</h2>
        <p>{error || 'Пациент с указанным идентификатором не зарегистрирован в системе клиники.'}</p>
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #fff5f5;
            color: #c53030;
            font-family: 'Inter', system-ui, sans-serif;
            text-align: center;
            padding: 2rem;
          }
          .error-icon {
            color: #e53e3e;
            margin-bottom: 1rem;
          }
          h2 { margin-bottom: 0.5rem; font-weight: 700; }
          p { color: #718096; }
        `}</style>
      </div>
    )
  }

  // Parse medical records to get the discharge
  let medical: any = {}
  try {
    if (patient.medicalRecord) {
      medical = JSON.parse(patient.medicalRecord)
    }
  } catch (e) {
    console.error('Failed to parse medicalRecord JSON:', e)
  }

  const discharge = medical.discharge

  if (!discharge || discharge.status !== 'COMPLETED') {
    return (
      <div className="not-ready-container">
        <FileText size={48} className="info-icon" />
        <h2>Выписка еще не оформлена</h2>
        <p>Ваш лечащий врач еще не завершил заполнение выписного эпикриза.</p>
        <p className="sub-text">Пожалуйста, свяжитесь с клиникой или подождите уведомления в боте.</p>
        <style jsx>{`
          .not-ready-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #f0f9ff;
            color: #0369a1;
            font-family: 'Inter', system-ui, sans-serif;
            text-align: center;
            padding: 2rem;
          }
          .info-icon {
            color: #0284c7;
            margin-bottom: 1rem;
            animation: pulse 2s infinite ease-in-out;
          }
          h2 { margin-bottom: 0.5rem; font-weight: 700; }
          p { color: #0284c7; margin-bottom: 0.25rem; }
          .sub-text { color: #64748b; font-size: 0.9rem; margin-top: 1rem; }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}</style>
      </div>
    )
  }

  // Helper for formatting date
  const formatDateString = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return format(d, 'dd MMMM yyyy', { locale: ru })
    } catch {
      return dateStr
    }
  }

  const formattedDOB = patient.dateOfBirth
    ? formatDateString(patient.dateOfBirth)
    : 'Не указана'

  return (
    <div className="page-background">
      {/* Navbar Actions (Hidden on Print) */}
      <header className="navbar no-print">
        <div className="navbar-content">
          <div className="navbar-logo">
            <span className="logo-icon">🏥</span>
            <span className="logo-text">Клиника «Темофеика»</span>
          </div>
          <div className="navbar-actions">
            <button className="btn-print" onClick={handlePrint}>
              <Printer size={16} /> Печать / Сохранить в PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Document Content */}
      <main className="document-wrapper">
        <div className="document-sheet glass-effect">
          
          {/* Medical Clinical Header */}
          <div className="clinical-header">
            <div className="clinic-stamp">
              <p className="stamp-bold">МЕДИЦИНСКАЯ КЛИНИКА «ТЕМОФЕИКА»</p>
              <p className="stamp-sub">Лицензия № ЛО-77-01-012345 от 12.04.2024</p>
              <p className="stamp-sub">Адрес: г. Москва, ул. Клиническая, д. 15 | Тел: +7 (495) 123-45-67</p>
            </div>
            <div className="document-meta-stamp text-right">
              <p>Медицинская документация</p>
              <p className="stamp-bold">Форма № 027/у</p>
              <p className="stamp-sub">Утверждена Минздравом РФ</p>
            </div>
          </div>

          <hr className="divider-double" />

          {/* Document Title */}
          <div className="document-title-block">
            <h2>ВЫПИСНОЙ ЭПИКРИЗ</h2>
            <h4>из медицинской карты амбулаторного (стационарного) больного</h4>
            <p className="doc-date">Дата оформления: {formatDateString(discharge.updatedAt)}</p>
          </div>

          {/* Patient Details Section */}
          <section className="section-block">
            <h3 className="section-title">1. Сведения о пациенте</h3>
            <table className="info-table">
              <tbody>
                <tr>
                  <td className="label-cell">Ф.И.О. пациента:</td>
                  <td className="value-cell bold">{patient.lastName} {patient.firstName}</td>
                </tr>
                <tr>
                  <td className="label-cell">Дата рождения:</td>
                  <td className="value-cell">{formattedDOB}</td>
                </tr>
                <tr>
                  <td className="label-cell">Контактный телефон:</td>
                  <td className="value-cell">{patient.phone}</td>
                </tr>
                {patient.email && (
                  <tr>
                    <td className="label-cell">Электронная почта:</td>
                    <td className="value-cell">{patient.email}</td>
                  </tr>
                )}
                <tr>
                  <td className="label-cell">Период лечения / наблюдения:</td>
                  <td className="value-cell highlight-text">
                    с {formatDateString(discharge.startDate)} по {formatDateString(discharge.endDate)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Clinical Details Section */}
          <section className="section-block">
            <h3 className="section-title">2. Клинический диагноз</h3>
            <div className="content-box diagnosis-box">
              <p>{discharge.diagnosis}</p>
            </div>
          </section>

          {discharge.complaints && (
            <section className="section-block">
              <h3 className="section-title">3. Жалобы и анамнез заболевания</h3>
              <div className="content-box">
                <p className="pre-wrap">{discharge.complaints}</p>
              </div>
            </section>
          )}

          {discharge.tests && (
            <section className="section-block">
              <h3 className="section-title">4. Данные обследований и лабораторных исследований</h3>
              <div className="content-box">
                <p className="pre-wrap">{discharge.tests}</p>
              </div>
            </section>
          )}

          {discharge.treatment && (
            <section className="section-block">
              <h3 className="section-title">5. Проведенное лечение в клинике</h3>
              <div className="content-box">
                <p className="pre-wrap">{discharge.treatment}</p>
              </div>
            </section>
          )}

          <section className="section-block">
            <h3 className="section-title">6. Назначения и медицинские рекомендации</h3>
            <div className="content-box recommendations-box">
              <p className="pre-wrap bold">{discharge.recommendations}</p>
            </div>
          </section>

          {/* Signatures & Stamp block */}
          <div className="signature-section-block">
            <div className="signature-row">
              <div className="signature-col">
                <p className="signature-title">Лечащий врач:</p>
                <p className="signature-name">{discharge.attendingDoctorName}</p>
              </div>
              <div className="signature-col text-right">
                <p className="signature-line-desc">Подпись врача _________________</p>
                <div className="seal-space">
                  М.П.
                </div>
              </div>
            </div>
          </div>

          {/* Footer warning */}
          <div className="document-footer-stamp">
            <p>Данная выписка является официальным медицинским документом клиники «Темофеика».</p>
            <p>Документ сформирован в электронной медицинской системе клиники.</p>
          </div>

        </div>
      </main>

      <style jsx global>{`
        /* Global CSS Rules for the layout */
        :root {
          --nav-bg: rgba(15, 23, 42, 0.9);
          --doc-bg: #ffffff;
          --primary: #2563eb;
          --primary-hover: #1d4ed8;
          --text-dark: #0f172a;
          --text-gray: #475569;
          --border-color: #cbd5e1;
        }

        .page-background {
          min-height: 100vh;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          font-family: 'Inter', system-ui, sans-serif;
          color: var(--text-dark);
          padding-top: 80px;
          padding-bottom: 40px;
        }

        /* Navbar Layout */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: var(--nav-bg);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 1000;
          display: flex;
          align-items: center;
        }

        .navbar-content {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .logo-icon {
          font-size: 1.3rem;
        }

        .btn-print {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
          transition: all 0.2s;
        }

        .btn-print:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 6px 10px -1px rgba(37, 99, 235, 0.3);
        }

        /* Document Sheet Container */
        .document-wrapper {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 1.5rem;
          box-sizing: border-box;
        }

        .document-sheet {
          background: var(--doc-bg);
          border-radius: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          padding: 3rem;
          box-sizing: border-box;
          border: 1px solid rgba(255, 255, 255, 0.8);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { transform: translateY(15px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* Clinical Branded Header */
        .clinical-header {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 1.5rem;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .clinic-stamp {
          color: var(--text-gray);
        }

        .document-meta-stamp {
          color: var(--text-gray);
          font-size: 0.85rem;
        }

        .text-right {
          text-align: right;
        }

        .stamp-bold {
          font-weight: 800;
          font-size: 0.9rem;
          color: var(--text-dark);
          margin-bottom: 0.3rem;
          letter-spacing: 0.02em;
        }

        .stamp-sub {
          font-size: 0.75rem;
          margin-bottom: 0.15rem;
        }

        .divider-double {
          border: none;
          border-top: 3px double var(--border-color);
          margin: 1.5rem 0;
        }

        /* Title block */
        .document-title-block {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .document-title-block h2 {
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: var(--text-dark);
          margin-bottom: 0.5rem;
        }

        .document-title-block h4 {
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-gray);
          margin-bottom: 0.75rem;
        }

        .doc-date {
          font-size: 0.85rem;
          font-style: italic;
          color: var(--text-gray);
        }

        /* Medical clinical sections */
        .section-block {
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--primary);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.4rem;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        /* Info Table */
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
        }

        .info-table tr {
          border-bottom: 1px dashed #f1f5f9;
        }

        .info-table td {
          padding: 0.65rem 0.5rem;
          font-size: 0.95rem;
          vertical-align: middle;
        }

        .label-cell {
          width: 30%;
          color: var(--text-gray);
          font-weight: 500;
        }

        .value-cell {
          color: var(--text-dark);
        }

        .value-cell.bold {
          font-weight: 700;
          font-size: 1.05rem;
        }

        .highlight-text {
          color: #1d4ed8;
          font-weight: 700;
        }

        /* Document Text Boxes */
        .content-box {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-left: 4px solid var(--border-color);
          border-radius: 0.5rem;
          padding: 1.25rem;
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-dark);
        }

        .diagnosis-box {
          border-left-color: #f59e0b;
          background: #fffbeb;
          font-weight: 600;
          color: #92400e;
        }

        .recommendations-box {
          border-left-color: #10b981;
          background: #f0fdf4;
          color: #065f46;
        }

        .pre-wrap {
          white-space: pre-wrap;
        }

        /* Signatures block */
        .signature-section-block {
          margin-top: 3.5rem;
          margin-bottom: 2rem;
          page-break-inside: avoid;
        }

        .signature-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          align-items: flex-end;
        }

        .signature-title {
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--text-gray);
          margin-bottom: 0.5rem;
        }

        .signature-name {
          font-weight: 800;
          font-size: 1.05rem;
          color: var(--text-dark);
        }

        .signature-line-desc {
          font-size: 0.9rem;
          color: var(--text-gray);
          margin-bottom: 1.5rem;
        }

        .seal-space {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border: 2px dashed var(--border-color);
          color: var(--border-color);
          border-radius: 50%;
          font-size: 0.8rem;
          font-weight: 700;
          text-align: center;
          margin-right: 2rem;
        }

        /* Footer Stamp */
        .document-footer-stamp {
          margin-top: 3rem;
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
          text-align: center;
          color: #94a3b8;
          font-size: 0.75rem;
          line-height: 1.4;
        }

        /* PRINT STYLING - Standard A4 PDF Output */
        @media print {
          /* Force page styling */
          @page {
            size: A4;
            margin: 1.8cm 1.5cm 1.5cm 1.5cm;
          }

          body, .page-background {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
          }

          .no-print {
            display: none !important;
          }

          .document-wrapper {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .document-sheet {
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            border-radius: 0 !important;
          }

          .section-title {
            color: black !important;
            border-bottom: 1.5px solid black !important;
          }

          .content-box {
            background: white !important;
            border: 1px solid #94a3b8 !important;
            border-left: 5px solid black !important;
            border-radius: 0 !important;
            padding: 1rem !important;
            color: black !important;
          }

          .diagnosis-box, .recommendations-box {
            border-left-color: black !important;
            color: black !important;
            background: white !important;
          }

          .divider-double {
            border-top: 3px double black !important;
          }

          .highlight-text {
            color: black !important;
          }

          .info-table tr {
            border-bottom: 1px dashed #cbd5e1 !important;
          }

          .seal-space {
            border: 2px dashed black !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  )
}
