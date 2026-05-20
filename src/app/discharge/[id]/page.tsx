'use client'

import React, { useEffect, useState, use } from 'react'
import { FileText, Printer, ShieldAlert, ArrowLeft, Calendar, User, Phone, CheckCircle, Mail, FileDown, Download, HelpCircle, X } from 'lucide-react'
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
  const [showPrintHint, setShowPrintHint] = useState(false)

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

  const handleDownloadDoc = () => {
    if (!patient || !discharge) return

    const fileName = `Выписка_${patient.lastName || ''}_${patient.firstName || ''}.doc`
    
    // Construct HTML template for Word
    const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Выписка из медицинской карты</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: "Arial", "Helvetica", sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #0f172a;
      margin: 1.5in 1in 1in 1in;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .header-table td {
      vertical-align: top;
      font-size: 9pt;
      color: #475569;
    }
    .stamp-bold {
      font-weight: bold;
      font-size: 10pt;
      color: #0f172a;
    }
    .divider-double {
      border: none;
      border-top: 3px double #cbd5e1;
      margin: 20px 0;
    }
    .title-block {
      text-align: center;
      margin-bottom: 30px;
    }
    .title-block h2 {
      font-size: 16pt;
      font-weight: bold;
      margin: 0 0 5px 0;
      color: #0f172a;
      letter-spacing: 1px;
    }
    .title-block h4 {
      font-size: 10pt;
      font-weight: normal;
      margin: 0 0 10px 0;
      color: #475569;
    }
    .doc-date {
      font-size: 9pt;
      font-style: italic;
      color: #475569;
    }
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      color: #2563eb;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 5px;
      margin-top: 25px;
      margin-bottom: 15px;
      text-transform: uppercase;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .info-table td {
      padding: 6px 0;
      font-size: 10pt;
      border-bottom: 1px dashed #e2e8f0;
    }
    .label-cell {
      width: 30%;
      color: #475569;
      font-weight: 500;
    }
    .value-cell {
      color: #0f172a;
    }
    .value-cell.bold {
      font-weight: bold;
      font-size: 11pt;
    }
    .highlight-text {
      color: #1d4ed8;
      font-weight: bold;
    }
    .content-box {
      background-color: #f8fafc;
      border-left: 4px solid #cbd5e1;
      padding: 12px;
      margin-bottom: 15px;
      font-size: 10pt;
    }
    .diagnosis-box {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      color: #92400e;
      font-weight: bold;
    }
    .recommendations-box {
      background-color: #f0fdf4;
      border-left: 4px solid #10b981;
      color: #065f46;
      font-weight: bold;
    }
    .pre-wrap {
      white-space: pre-wrap;
    }
    .signature-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 40px;
      margin-bottom: 30px;
    }
    .signature-table td {
      vertical-align: bottom;
    }
    .signature-title {
      font-weight: bold;
      font-size: 10pt;
      color: #475569;
      margin-bottom: 5px;
    }
    .signature-name {
      font-weight: bold;
      font-size: 11pt;
      color: #0f172a;
    }
    .seal-space {
      width: 80px;
      height: 80px;
      border: 2px dashed #cbd5e1;
      color: #cbd5e1;
      border-radius: 50%;
      font-size: 8pt;
      font-weight: bold;
      text-align: center;
      line-height: 80px;
      float: right;
    }
    .footer-stamp {
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      text-align: center;
      color: #94a3b8;
      font-size: 8pt;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <!-- Header Table -->
  <table class="header-table">
    <tr>
      <td style="width: 65%;">
        <div class="stamp-bold">МЕДИЦИНСКАЯ КЛИНИКА «PlanetaMed»</div>
        <div>Лицензия № ЛО-77-01-012345 от 12.04.2024</div>
        <div>Адрес: г. Москва, ул. Клиническая, д. 15 | Тел: +7 (495) 123-45-67</div>
      </td>
      <td style="width: 35%; text-align: right;">
        <div>Медицинская документация</div>
        <div class="stamp-bold">Форма № 027/у</div>
        <div>Утверждена Минздравом РФ</div>
      </td>
    </tr>
  </table>

  <div class="divider-double"></div>

  <!-- Title Block -->
  <div class="title-block">
    <h2>ВЫПИСНОЙ ЭПИКРИЗ</h2>
    <h4>из медицинской карты амбулаторного (стационарного) больного</h4>
    <div class="doc-date">Дата оформления: ${formatDateString(discharge.updatedAt)}</div>
  </div>

  <!-- Patient info -->
  <div class="section-title">1. Сведения о пациенте</div>
  <table class="info-table">
    <tr>
      <td class="label-cell">Ф.И.О. пациента:</td>
      <td class="value-cell bold">${patient.lastName || ''} ${patient.firstName || ''}</td>
    </tr>
    <tr>
      <td class="label-cell">Дата рождения:</td>
      <td class="value-cell">${formattedDOB}</td>
    </tr>
    <tr>
      <td class="label-cell">Контактный телефон:</td>
      <td class="value-cell">${patient.phone || ''}</td>
    </tr>
    ${patient.email ? `
    <tr>
      <td class="label-cell">Электронная почта:</td>
      <td class="value-cell">${patient.email}</td>
    </tr>
    ` : ''}
    <tr>
      <td class="label-cell">Период лечения / наблюдения:</td>
      <td class="value-cell highlight-text">
        с ${formatDateString(discharge.startDate)} по ${formatDateString(discharge.endDate)}
      </td>
    </tr>
  </table>

  <!-- Diagnosis -->
  <div class="section-title">2. Клинический диагноз</div>
  <div class="content-box diagnosis-box">
    ${discharge.diagnosis || ''}
  </div>

  <!-- Complaints -->
  ${discharge.complaints ? `
  <div class="section-title">3. Жалобы и анамнез заболевания</div>
  <div class="content-box pre-wrap">${discharge.complaints}</div>
  ` : ''}

  <!-- Tests -->
  ${discharge.tests ? `
  <div class="section-title">4. Данные обследований и лабораторных исследований</div>
  <div class="content-box pre-wrap">${discharge.tests}</div>
  ` : ''}

  <!-- Treatment -->
  ${discharge.treatment ? `
  <div class="section-title">5. Проведенное лечение в клинике</div>
  <div class="content-box pre-wrap">${discharge.treatment}</div>
  ` : ''}

  <!-- Recommendations -->
  <div class="section-title">6. Назначения и медицинские рекомендации</div>
  <div class="content-box recommendations-box pre-wrap">${discharge.recommendations || ''}</div>

  <!-- Signatures -->
  <table class="signature-table">
    <tr>
      <td style="width: 60%;">
        <div class="signature-title">Лечащий врач:</div>
        <div class="signature-name">${discharge.attendingDoctorName || ''}</div>
      </td>
      <td style="width: 40%; text-align: right;">
        <div style="margin-bottom: 20px; font-size: 10pt; color: #475569;">Подпись врача _________________</div>
        <div class="seal-space">М.П.</div>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <div class="footer-stamp">
    <p>Данная выписка является официальным медицинским документом клиники «PlanetaMed».</p>
    <p>Документ сформирован в электронной медицинской системе клиники.</p>
  </div>
</body>
</html>
`

    // Create a blob with a UTF-8 BOM so Russian Cyrillic characters are encoded properly in Excel/Word on Windows
    const blob = new Blob(['\uFEFF' + htmlContent], {
      type: 'application/vnd.ms-word;charset=utf-8'
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
            <span className="logo-text">PlanetaMed</span>
          </div>
          <div className="navbar-actions">
            <button className="btn-doc" onClick={handleDownloadDoc}>
              <FileDown size={16} /> Скачать Word (DOC)
            </button>
            <button className="btn-pdf" onClick={() => setShowPrintHint(true)}>
              <Download size={16} /> Сохранить в PDF
            </button>
            <button className="btn-print" onClick={handlePrint}>
              <Printer size={16} /> Распечатать
            </button>
          </div>
        </div>
      </header>

      {/* Print Hint Modal */}
      {showPrintHint && (
        <div className="modal-overlay no-print" onClick={() => setShowPrintHint(false)}>
          <div className="modal-content glass-effect" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPrintHint(false)}>
              <X size={20} />
            </button>
            <div className="modal-header">
              <span className="modal-icon">📄</span>
              <h3>Как сохранить выписку в PDF?</h3>
            </div>
            <div className="modal-body">
              <p>Для сохранения документа в формате PDF выполните следующие простые шаги:</p>
              <ol className="hint-steps">
                <li>
                  <span className="step-num">1</span>
                  <p>В открывшемся окне печати найдите поле <strong>«Принтер»</strong> (или «Назначение»).</p>
                </li>
                <li>
                  <span className="step-num">2</span>
                  <p>Выберите в выпадающем списке вариант <strong>«Сохранить как PDF»</strong> (или «Microsoft Print to PDF»).</p>
                </li>
                <li>
                  <span className="step-num">3</span>
                  <p>Нажмите синюю кнопку <strong>«Сохранить»</strong> внизу и выберите папку на компьютере.</p>
                </li>
              </ol>
              <div className="modal-tip">
                <HelpCircle size={16} className="tip-icon" />
                <span>Это позволяет сохранить бланк в идеальном векторном качестве, пригодном для пересылки.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={() => setShowPrintHint(false)}>
                Отмена
              </button>
              <button 
                className="btn-modal-confirm" 
                onClick={() => {
                  setShowPrintHint(false)
                  setTimeout(() => {
                    window.print()
                  }, 300)
                }}
              >
                Понятно, открыть печать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Document Content */}
      <main className="document-wrapper">
        <div className="document-sheet glass-effect">
          
          {/* Medical Clinical Header */}
          <div className="clinical-header">
            <div className="clinic-stamp">
              <p className="stamp-bold">МЕДИЦИНСКАЯ КЛИНИКА «PlanetaMed»</p>
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
            <p>Данная выписка является официальным медицинским документом клиники «PlanetaMed».</p>
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

        .navbar-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .btn-doc {
          background: #185abd; /* Microsoft Word blue */
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
          box-shadow: 0 4px 6px -1px rgba(24, 90, 189, 0.2);
          transition: all 0.2s ease;
        }

        .btn-doc:hover {
          background: #12448c;
          transform: translateY(-1px);
          box-shadow: 0 6px 10px -1px rgba(24, 90, 189, 0.3);
        }

        .btn-pdf {
          background: #b91c1c; /* PDF red */
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
          box-shadow: 0 4px 6px -1px rgba(185, 28, 28, 0.2);
          transition: all 0.2s ease;
        }

        .btn-pdf:hover {
          background: #991b1b;
          transform: translateY(-1px);
          box-shadow: 0 6px 10px -1px rgba(185, 28, 28, 0.3);
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

        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.25s ease-out;
        }

        .modal-content {
          background: white;
          border-radius: 1.25rem;
          width: 90%;
          max-width: 520px;
          padding: 2.25rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.6);
          animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .modal-close {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.375rem;
          transition: all 0.2s;
        }

        .modal-close:hover {
          color: #475569;
          background: #f1f5f9;
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .modal-icon {
          font-size: 1.75rem;
        }

        .modal-header h3 {
          font-size: 1.25rem;
          font-weight: 750;
          color: #0f172a;
          margin: 0;
        }

        .modal-body {
          color: #475569;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .modal-body p {
          margin-bottom: 1.25rem;
        }

        .hint-steps {
          list-style: none;
          padding: 0;
          margin: 0 0 1.5rem 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .hint-steps li {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .step-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
          font-weight: 700;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .hint-steps p {
          margin: 0;
          color: #334155;
        }

        .modal-tip {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .tip-icon {
          color: #16a34a;
          flex-shrink: 0;
          margin-top: 0.15rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 2rem;
          border-top: 1px solid #f1f5f9;
          padding-top: 1.25rem;
        }

        .btn-modal-cancel {
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-modal-cancel:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        .btn-modal-confirm {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.6rem 1.2rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
        }

        .btn-modal-confirm:hover {
          background: var(--primary-hover);
          box-shadow: 0 6px 10px -1px rgba(37, 99, 235, 0.3);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Mobile Responsive Adjustments */
        @media (max-width: 640px) {
          .navbar {
            height: auto;
            padding: 0.75rem 0;
          }
          .navbar-content {
            flex-direction: column;
            gap: 0.75rem;
            padding: 0 1rem;
          }
          .navbar-logo {
            font-size: 1rem;
          }
          .navbar-actions {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }
          .navbar-actions button {
            padding: 0.5rem 0.75rem;
            font-size: 0.75rem;
            justify-content: center;
          }
          .navbar-actions button:nth-child(3) {
            grid-column: span 2;
          }
          .page-background {
            padding-top: 130px;
          }
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
