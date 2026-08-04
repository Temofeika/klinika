import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/appointments?doctorId=...&date=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')
    const patientId = searchParams.get('patientId')
    const dateStr = searchParams.get('date')

    const where: any = {}
    if (doctorId) where.doctorId = doctorId
    if (patientId) where.patientId = patientId

    if (dateStr) {
      const targetDate = new Date(dateStr)
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0)
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59)
      where.startTime = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
        service: true
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return NextResponse.json(appointments)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/appointments
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { patientId, doctorId, serviceId, startTime, endTime, room, notes } = body

    if (!patientId || !doctorId || !startTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + 30 * 60000)

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        serviceId: serviceId || null,
        startTime: start,
        endTime: end,
        room: room || '101',
        notes: notes || '',
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

// PATCH /api/appointments
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, notes, room } = body

    if (!id) {
      return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 })
    }

    const data: any = {}
    if (status) data.status = status
    if (notes !== undefined) data.notes = notes
    if (room !== undefined) data.room = room

    const updated = await prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: true,
        service: true
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
