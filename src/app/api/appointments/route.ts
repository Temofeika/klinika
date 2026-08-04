import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date') // "YYYY-MM-DD"
  const doctorId = searchParams.get('doctorId')

  try {
    let where: any = {}

    if (dateStr) {
      const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)
      where.startTime = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    if (doctorId) {
      where.doctorId = doctorId
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true }
        },
        doctor: {
          select: { id: true, firstName: true, lastName: true, position: true }
        },
        service: true
      },
      orderBy: { startTime: 'asc' }
    })

    return NextResponse.json(appointments)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { patientId, doctorId, serviceId, startTime, endTime, notes } = body

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        serviceId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        notes,
        status: 'BOOKED'
      },
      include: {
        patient: true,
        doctor: true,
        service: true
      }
    })

    return NextResponse.json(appointment)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, status } = body

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(appointment)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
