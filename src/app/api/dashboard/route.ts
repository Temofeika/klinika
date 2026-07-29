import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const doctorId = searchParams.get('doctorId')

  try {
    let patientFilter: any = {}
    let isAdmin = false

    if (doctorId) {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId }
      })
      isAdmin = doctor?.position === 'Администратор' || doctor?.position === 'Администратор системы'
      
      if (!isAdmin) {
        patientFilter = {
          doctors: { some: { id: doctorId } }
        }
      }
    } else {
      return NextResponse.json({ error: 'Missing doctorId' }, { status: 400 })
    }

    // 1. Get total active patients
    const totalPatients = await prisma.patient.count({
      where: patientFilter
    })

    // 2. Get unread messages count
    const unreadMessagesCount = await prisma.message.count({
      where: {
        isIncoming: true,
        isRead: false,
        patient: patientFilter,
        ...(isAdmin ? {} : { OR: [{ doctorId: doctorId }, { doctorId: null }] })
      }
    })

    // 3. Find patients requiring response (they have unread messages)
    const patientsNeedingResponse = await prisma.patient.findMany({
      where: {
        ...patientFilter,
        messages: {
          some: {
            isIncoming: true,
            isRead: false,
            ...(isAdmin ? {} : { OR: [{ doctorId: doctorId }, { doctorId: null }] })
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        lastMessageAt: true,
        messages: {
          where: {
            isIncoming: true,
            isRead: false,
            ...(isAdmin ? {} : { OR: [{ doctorId: doctorId }, { doctorId: null }] })
          },
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { lastMessageAt: 'desc' },
      take: 5
    })

    // 4. Find recent events (last 10 incoming messages)
    const recentMessages = await prisma.message.findMany({
      where: {
        isIncoming: true,
        patient: patientFilter,
        ...(isAdmin ? {} : { OR: [{ doctorId: doctorId }, { doctorId: null }] })
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 8
    })

    return NextResponse.json({
      totalPatients,
      unreadMessagesCount,
      patientsNeedingResponse,
      recentMessages
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
