'use client'

import React, { useState, useEffect } from 'react'
import { Activity, Pill, AlertTriangle, ClipboardList, Plus, History, X, FileText, Send, Check } from 'lucide-react'

interface PatientMedicalCardProps {
  patient: any;
  medical: {
    diagnoses: { id: string; name: string; date: string; status: string }[]
    medications: { id: string; name: string; dosage: string; period: string }[]
    allergies: { id: string; name: string; severity: string }[]
    history: { date: string; desc: string }[]
    protocol?: { complaints: string; anamnesis: string; objective: string }
    discharge?: any
  }
  onUpdate: (updated: any) => void
}

export default function PatientMedicalCard({ patient, medical, onUpdate }: PatientMedicalCardProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'protocol'>('summary')
  const [showDiagModal, setShowDiagModal] = useState(false)
  const [showMedModal, setShowMedModal] = useState(false)
  const [showAllergyModal, setShowAllergyModal] = useState(false)

  // Protocol state
  const [complaints, setComplaints] = useState(medical.protocol?.complaints || '')
  const [anamnesis, setAnamnesis] = useState(medical.protocol?.anamnesis || '')
  const [objective, setObjective] = useState(medical.protocol?.objective || '')
  
  // Templates state
  const [templates, setTemplates] = useState<any[]>([])

  // MKB-10 Autocomplete State
  const [diagSearch, setDiagSearch] = useState('')
  const [diagStatus, setDiagStatus] = useState('ACTIVE')
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [filteredMkb, setFilteredMkb] = useState<any[]>([])

  const [medName, setMedName] = useState('')
  const [medDosage, setMedDosage] = useState('')
  const [medPeriod, setMedPeriod] = useState('')

  const [allergyName, setAllergyName] = useState('')
  const [allergySeverity, setAllergySeverity] = useState('LOW')

  useEffect(() => {
    fetch('/api/templates')
      .then(res => res.json())
      .then(data => setTemplates(Array.isArray(data) ? data : []))
  }, [])

  useEffect(() => {
    if (!diagSearch || diagSearch.length < 2) {
      setFilteredMkb([])
      return
    }
    const delayDebounceFn = setTimeout(() => {
      fetch(`/api/diagnosis?q=${encodeURIComponent(diagSearch)}`)
        .then(res => res.json())
        .then(data => setFilteredMkb(Array.isArray(data) ? data : []))
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [diagSearch])

  const applyTemplate = (contentStr: string) => {
    try {
      const parsed = JSON.parse(contentStr)
      if (parsed.complaints) setComplaints(parsed.complaints)
      if (parsed.anamnesis) setAnamnesis(parsed.anamnesis)
      if (parsed.objective) setObjective(parsed.objective)
    } catch(e) {
      console.error(e)
    }
  }

  const handleSaveProtocol = () => {
    const updated = {
      ...medical,
      protocol: { complaints, anamnesis, objective }
    }
    onUpdate(updated)
    alert("Протокол приема сохранен")
  }

  const handleGenerateDischarge = () => {
    if (!medical.diagnoses || medical.diagnoses.length === 0) {
      alert("Невозможно сформировать выписку без установленного диагноза.")
      return
    }

    const today = new Date().toLocaleDateString('ru-RU')
    const primaryDiag = medical.diagnoses[0].name

    const discharge = {
      status: 'COMPLETED',
      startDate: today,
      endDate: today,
      diagnosis: primaryDiag,
      attendingDoctorName: 'Д-р Тестовый',
      generatedAt: new Date().toISOString()
    }

    const updated = {
      ...medical,
      discharge,
      history: [
        {
          date: today,
          desc: `Сформирован выписной эпикриз. Основной диагноз: ${primaryDiag}.`
        },
        ...(medical.history || [])
      ]
    }
    onUpdate(updated)
    alert("Выписка успешно сформирована. Пациент получит ее в Telegram.")
  }

  const handleAddDiagnosis = (e: React.FormEvent) => {
    e.preventDefault()
    if (!diagSearch.trim()) return

    const today = new Date().toLocaleDateString('ru-RU')
    const newDiag = {
      id: Date.now().toString(),
      name: diagSearch,
      date: today,
      status: diagStatus
    }

    const updated = {
      ...medical,
      diagnoses: [...(medical.diagnoses || []), newDiag],
      history: [
        {
          date: today,
          desc: `Установлен диагноз: ${diagSearch} (${diagStatus === 'ACTIVE' ? 'Активный' : 'Хронический'}).`
        },
        ...(medical.history || [])
      ]
    }

    onUpdate(updated)
    setDiagSearch('')
    setDiagStatus('ACTIVE')
    setShowDiagModal(false)
  }

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault()
    if (!medName.trim()) return

    const today = new Date().toLocaleDateString('ru-RU')
    const newMed = {
      id: Date.now().toString(),
      name: medName,
      dosage: medDosage || '1 таб.',
      period: medPeriod || 'Длительно'
    }

    const updated = {
      ...medical,
      medications: [...(medical.medications || []), newMed],
      history: [
        {
          date: today,
          desc: `Назначен препарат: ${medName} (${newMed.dosage}, ${newMed.period}).`
        },
        ...(medical.history || [])
      ]
    }

    onUpdate(updated)
    setMedName('')
    setMedDosage('')
    setMedPeriod('')
    setShowMedModal(false)
  }

  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault()
    if (!allergyName.trim()) return

    const today = new Date().toLocaleDateString('ru-RU')
    const newAllergy = {
      id: Date.now().toString(),
      name: allergyName,
      severity: allergySeverity
    }

    const updated = {
      ...medical,
      allergies: [...(medical.allergies || []), newAllergy],
      history: [
        {
          date: today,
          desc: `Выявлена аллергия: ${allergyName} (риск: ${allergySeverity === 'HIGH' ? 'Высокий' : 'Низкий'}).`
        },
        ...(medical.history || [])
      ]
    }

    onUpdate(updated)
    setAllergyName('')
    setAllergySeverity('LOW')
    setShowAllergyModal(false)
  }

  const handleCreateLabOrder = async () => {
    try {
      const doctorId = patient.doctors?.[0]?.id;
      if (!doctorId) {
        alert("У пациента не назначен лечащий врач. Назначьте врача перед созданием направления.");
        return;
      }
      const res = await fetch('/api/labs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          doctorId: doctorId,
          notes: 'Назначено из ЭМК (Протокол осмотра)',
        })
      });
      if (res.ok) {
        alert('Направление в лабораторию успешно создано!');
      } else {
        alert('Ошибка при создании направления.');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка при создании направления.');
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex items-center gap-4 p-4 bg-white border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'summary' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Сводка пациента
        </button>
        <button 
          onClick={() => setActiveTab('protocol')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'protocol' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Протокол осмотра (ЭМК)
        </button>
        <div className="flex-1"></div>
        
        <button onClick={handleCreateLabOrder} className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-purple-200">
          <Activity size={16} /> Назначить анализы
        </button>

        {medical.discharge?.status === 'COMPLETED' ? (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <Check size={16} /> <span className="text-sm font-bold">Выписка готова</span>
          </div>
        ) : (
          <button onClick={handleGenerateDischarge} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <FileText size={16} /> Сформировать выписку
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Diagnoses */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h4 className="flex items-center gap-2 font-bold text-slate-800"><Activity size={18} className="text-blue-500" /> Диагнозы</h4>
                <button onClick={() => setShowDiagModal(true)} className="p-1.5 hover:bg-white bg-slate-200 rounded-md transition-colors"><Plus size={16} className="text-slate-700" /></button>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {medical.diagnoses && medical.diagnoses.length > 0 ? (
                  medical.diagnoses.map(d => (
                    <div key={d.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="font-semibold text-slate-800 text-sm">{d.name}</div>
                      <div className="text-xs text-slate-500 mt-1 flex justify-between">
                        <span>{d.date}</span>
                        <span className={`font-bold ${d.status === 'ACTIVE' ? 'text-red-500' : 'text-amber-500'}`}>{d.status === 'ACTIVE' ? 'АКТИВНЫЙ' : 'ХРОНИЧЕСКИЙ'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic text-center py-4">Диагнозы не установлены</p>
                )}
              </div>
            </div>

            {/* Medications */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h4 className="flex items-center gap-2 font-bold text-slate-800"><Pill size={18} className="text-purple-500" /> Препараты</h4>
                <button onClick={() => setShowMedModal(true)} className="p-1.5 hover:bg-white bg-slate-200 rounded-md transition-colors"><Plus size={16} className="text-slate-700" /></button>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {medical.medications && medical.medications.length > 0 ? (
                  medical.medications.map(m => (
                    <div key={m.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="font-semibold text-slate-800 text-sm">{m.name}</div>
                      <div className="text-xs text-slate-500 mt-1">{m.dosage} • {m.period}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic text-center py-4">Препараты не назначены</p>
                )}
              </div>
            </div>

            {/* Allergies */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h4 className="flex items-center gap-2 font-bold text-slate-800"><AlertTriangle size={18} className="text-rose-500" /> Аллергии</h4>
                <button onClick={() => setShowAllergyModal(true)} className="p-1.5 hover:bg-white bg-slate-200 rounded-md transition-colors"><Plus size={16} className="text-slate-700" /></button>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {medical.allergies && medical.allergies.length > 0 ? (
                  medical.allergies.map(a => (
                    <div key={a.id} className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                      <div className="font-semibold text-slate-800 text-sm">{a.name}</div>
                      <div className="text-xs text-slate-500 mt-1 flex justify-between">
                        <span>Риск:</span>
                        <span className={`font-bold ${a.severity === 'HIGH' ? 'text-rose-600' : 'text-emerald-600'}`}>{a.severity === 'HIGH' ? 'ВЫСОКИЙ' : 'НИЗКИЙ'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic text-center py-4">Аллергии не выявлены</p>
                )}
              </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:col-span-2">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h4 className="flex items-center gap-2 font-bold text-slate-800"><History size={18} className="text-slate-500" /> История изменений</h4>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {medical.history && medical.history.length > 0 ? (
                  <div className="border-l-2 border-slate-200 pl-4 space-y-6">
                    {medical.history.map((event, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white"></div>
                        <div className="text-xs font-bold text-slate-400 mb-1">{event.date}</div>
                        <div className="text-sm text-slate-700">{event.desc}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic text-center py-4">История изменений пуста</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'protocol' && (
          <div className="max-w-4xl mx-auto space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-bold text-slate-800 font-outfit">Протокол осмотра</h2>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-500">Шаблон:</span>
                <select 
                  className="border border-slate-300 rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const tmpl = templates.find(t => t.id === e.target.value)
                    if (tmpl) applyTemplate(tmpl.content)
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>-- Выберите шаблон --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Жалобы пациента</label>
                <textarea 
                  rows={3} 
                  className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Опишите жалобы пациента..."
                  value={complaints}
                  onChange={e => setComplaints(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Анамнез заболевания (Anamnesis morbi / vitae)</label>
                <textarea 
                  rows={4} 
                  className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="История развития заболевания, аллергологический анамнез..."
                  value={anamnesis}
                  onChange={e => setAnamnesis(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Объективный статус (Status praesens)</label>
                <textarea 
                  rows={5} 
                  className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Общее состояние, данные осмотра, пальпации, аускультации..."
                  value={objective}
                  onChange={e => setObjective(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                onClick={handleSaveProtocol}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
              >
                Сохранить протокол
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- DIAGNOSIS MODAL --- */}
      {showDiagModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">Добавить диагноз</h3>
              <button onClick={() => setShowDiagModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddDiagnosis} className="space-y-4 relative">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Название диагноза (МКБ-10)</label>
                <input 
                  type="text" 
                  required 
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Например, Острый бронхит"
                  value={diagSearch}
                  onChange={e => {
                    setDiagSearch(e.target.value);
                    setShowAutocomplete(true);
                  }}
                  onFocus={() => setShowAutocomplete(true)}
                  onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                />
                {showAutocomplete && filteredMkb.length > 0 && (
                  <div className="absolute top-[70px] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                    {filteredMkb.map(item => (
                      <div 
                        key={item.code} 
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                        onClick={() => {
                          setDiagSearch(`${item.code} - ${item.name}`);
                          setShowAutocomplete(false);
                        }}
                      >
                        <span className="font-bold text-blue-600 mr-2">{item.code}</span>
                        <span className="text-slate-700 text-sm">{item.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Статус</label>
                <select 
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={diagStatus} 
                  onChange={e => setDiagStatus(e.target.value)}
                >
                  <option value="ACTIVE">Активный</option>
                  <option value="CHRONIC">Хронический</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-2">
                <button type="button" className="px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors" onClick={() => setShowDiagModal(false)}>Отмена</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MEDICATION MODAL --- */}
      {showMedModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">Назначить препарат</h3>
              <button onClick={() => setShowMedModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddMedication} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Название лекарства</label>
                <input type="text" required className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Например, Ибупрофен 400мг" value={medName} onChange={e => setMedName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Дозировка</label>
                <input type="text" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Например, 1 таб. после еды" value={medDosage} onChange={e => setMedDosage(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Период приема</label>
                <input type="text" className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Например, 10 дней или Постоянно" value={medPeriod} onChange={e => setMedPeriod(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-2">
                <button type="button" className="px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors" onClick={() => setShowMedModal(false)}>Отмена</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">Назначить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ALLERGY MODAL --- */}
      {showAllergyModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">Добавить аллергию</h3>
              <button onClick={() => setShowAllergyModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddAllergy} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Аллерген</label>
                <input type="text" required className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Например, Аспирин" value={allergyName} onChange={e => setAllergyName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Степень риска</label>
                <select className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={allergySeverity} onChange={e => setAllergySeverity(e.target.value)}>
                  <option value="LOW">Низкий риск</option>
                  <option value="HIGH">Высокий риск</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-2">
                <button type="button" className="px-4 py-2 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors" onClick={() => setShowAllergyModal(false)}>Отмена</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
