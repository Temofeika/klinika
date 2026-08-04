import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Admit patient
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { patientId, doctorId, bedId, diagnosis, notes } = body
    
    // Check if bed is available
    const bed = await prisma.bed.findUnique({ where: { id: bedId } })
    if (bed?.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'Койка занята или недоступна' }, { status: 400 })
    }

    // Create hospitalization
    const hosp = await prisma.hospitalization.create({
      data: {
        patientId,
        doctorId,
        bedId,
        diagnosis,
        notes
      }
    })

    // Update bed status
    await prisma.bed.update({
      where: { id: bedId },
      data: { status: 'OCCUPIED' }
    })

    return NextResponse.json(hosp)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Discharge patient
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { hospitalizationId, dischargeNotes } = body

    const hosp = await prisma.hospitalization.update({
      where: { id: hospitalizationId },
      data: {
        status: 'DISCHARGED',
        endDate: new Date(),
        notes: dischargeNotes
      }
    })

    // Free the bed
    await prisma.bed.update({
      where: { id: hosp.bedId },
      data: { status: 'AVAILABLE' }
    })

    return NextResponse.json(hosp)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
