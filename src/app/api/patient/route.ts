import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const doctorId = searchParams.get('doctorId')

  try {
    if (id) {
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          messages: true,
          messengerAccounts: true,
          doctors: true
        }
      })
      return NextResponse.json(patient)
    }

    let whereClause: any = {}
    if (doctorId) {
      const doctor = await prisma.doctor.findUnique({
        where: { id: doctorId }
      })
      if (doctor?.position === 'Администратор' || doctor?.position === 'Администратор системы') {
        // Administrators see all patients in the database
        whereClause = {}
      } else {
        // Standard doctors only see patients where they are one of the attending doctors
        whereClause = {
          doctors: {
            some: { id: doctorId }
          }
        }
      }
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        lastMessageAt: true,
        doctors: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        },
        messages: {
          select: {
            isRead: true,
            isIncoming: true
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    })

    return NextResponse.json(patients)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, firstName, lastName, phone, email, dateOfBirth, gender, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing patient ID' }, { status: 400 })
    }

    const updateData: any = {}
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (email !== undefined) updateData.email = email
    if (gender !== undefined) updateData.gender = gender
    if (notes !== undefined) updateData.notes = notes
    
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null
    }

    if (phone !== undefined) {
      let cleaned = phone.replace(/[^\d+]/g, '')
      if (cleaned.startsWith('8') && cleaned.length === 11) {
        cleaned = '+7' + cleaned.substring(1)
      }
      if (cleaned.startsWith('7') && cleaned.length === 11) {
        cleaned = '+' + cleaned
      }
      if (!cleaned.startsWith('+') && cleaned.length > 0) {
        cleaned = '+' + cleaned
      }
      
      const duplicate = await prisma.patient.findFirst({
        where: {
          phone: cleaned,
          NOT: { id }
        }
      })
      if (duplicate) {
        return NextResponse.json({ error: 'Пациент с таким номером телефона уже зарегистрирован!' }, { status: 409 })
      }
      updateData.phone = cleaned
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: updateData,
      include: {
        messages: true,
        messengerAccounts: true,
        doctors: true
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Patient UPDATE error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
