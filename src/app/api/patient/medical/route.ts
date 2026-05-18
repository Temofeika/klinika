import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { patientId, medicalRecord } = await request.json()

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: { 
        medicalRecord: typeof medicalRecord === 'string' ? medicalRecord : JSON.stringify(medicalRecord) 
      }
    })

    return NextResponse.json({ success: true, patient: updated })
  } catch (err: any) {
    console.error('Failed to update patient medical record:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
