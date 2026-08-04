import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/emr?patientId=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID required' }, { status: 400 })
    }

    const records = await prisma.eMRRecord.findMany({
      where: { patientId },
      include: {
        doctor: true,
        appointment: true
      },
      orderBy: { dateTime: 'desc' }
    })

    return NextResponse.json(records)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/emr
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      patientId,
      doctorId,
      appointmentId,
      complaints,
      anamnesis,
      objective,
      icd10Code,
      icd10Name,
      treatmentPlan,
      prescriptions,
      signedBy
    } = body

    if (!patientId || !doctorId) {
      return NextResponse.json({ error: 'Patient ID and Doctor ID required' }, { status: 400 })
    }

    const record = await prisma.eMRRecord.create({
      data: {
        patientId,
        doctorId,
        appointmentId: appointmentId || null,
        complaints: complaints || '',
        anamnesis: anamnesis || '',
        objective: objective || '',
        icd10Code: icd10Code || '',
        icd10Name: icd10Name || '',
        treatmentPlan: treatmentPlan || '',
        prescriptions: prescriptions || '',
        signedBy: signedBy || `Врач (${new Date().toLocaleDateString()})`
      },
      include: {
        doctor: true,
        appointment: true
      }
    })

    // Update appointment status to COMPLETED if appointmentId provided
    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' }
      }).catch(() => {})
    }

    return NextResponse.json(record)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
