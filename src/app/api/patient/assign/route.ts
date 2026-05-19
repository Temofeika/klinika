import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { patientId, doctorId } = body

    if (!patientId) {
      return NextResponse.json({ error: 'Missing patientId' }, { status: 400 })
    }

    // 1. Fetch patient details
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    })
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // 2. Fetch target doctor details
    const doctor = doctorId ? await prisma.doctor.findUnique({
      where: { id: doctorId }
    }) : null

    const doctorName = doctor 
      ? `${doctor.firstName} ${doctor.lastName} (${doctor.position})`
      : 'Не назначен (ожидает распределения)'

    // 3. Update patient's doctor and clinical history record
    let medical: any = { documents: [], history: [] }
    if (patient.medicalRecord) {
      try {
        medical = JSON.parse(patient.medicalRecord)
      } catch (e) {}
    }

    if (!Array.isArray(medical.history)) medical.history = []

    const today = new Date().toLocaleDateString('ru-RU')
    medical.history.unshift({
      date: today,
      desc: `Перенаправлен к специалисту: ${doctorName}.`
    })

    const action = body.action || 'connect' // 'connect' or 'disconnect'

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        doctors: action === 'disconnect' 
          ? { disconnect: { id: doctorId } }
          : { connect: { id: doctorId } },
        medicalRecord: JSON.stringify(medical)
      },
      include: {
        doctors: true
      }
    })

    return NextResponse.json({ success: true, patient: updatedPatient })
  } catch (error: any) {
    console.error('Assign Doctor API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
