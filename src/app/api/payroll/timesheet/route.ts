import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { doctorId, action } = body // action: 'CLOCK_IN' or 'CLOCK_OUT'

    if (!doctorId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Find if there's already a timesheet for today
    let timesheet = await prisma.timesheet.findFirst({
      where: {
        doctorId,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    if (action === 'CLOCK_IN') {
      if (timesheet && timesheet.clockIn) {
        return NextResponse.json({ error: 'Already clocked in today' }, { status: 400 })
      }
      
      timesheet = await prisma.timesheet.create({
        data: {
          doctorId,
          date: new Date(),
          clockIn: new Date()
        }
      })
    } else if (action === 'CLOCK_OUT') {
      if (!timesheet || !timesheet.clockIn) {
        return NextResponse.json({ error: 'Not clocked in yet' }, { status: 400 })
      }
      if (timesheet.clockOut) {
        return NextResponse.json({ error: 'Already clocked out today' }, { status: 400 })
      }

      timesheet = await prisma.timesheet.update({
        where: { id: timesheet.id },
        data: { clockOut: new Date() }
      })
    }

    return NextResponse.json(timesheet)
  } catch (error) {
    console.error('Error with timesheet:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
