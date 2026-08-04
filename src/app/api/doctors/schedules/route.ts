import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Get all doctors with their schedules
export async function GET(req: Request) {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        schedules: true
      },
      orderBy: { lastName: 'asc' }
    })
    return NextResponse.json(doctors)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Update a doctor's schedule
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { doctorId, schedules } = body
    
    // schedules should be an array of objects: { dayOfWeek, startTime, endTime, slotDuration }
    // We will delete all existing schedules for this doctor and insert the new ones
    
    await prisma.doctorSchedule.deleteMany({
      where: { doctorId }
    })
    
    if (schedules && schedules.length > 0) {
      await prisma.doctorSchedule.createMany({
        data: schedules.map((s: any) => ({
          doctorId,
          dayOfWeek: parseInt(s.dayOfWeek),
          startTime: s.startTime,
          endTime: s.endTime,
          slotDuration: parseInt(s.slotDuration) || 30
        }))
      })
    }
    
    const updated = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { schedules: true }
    })
    
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
