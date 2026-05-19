import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('Seeding doctors and assigning patients...')

    // 1. Create or update Administrator
    const admin = await prisma.doctor.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        firstName: 'Главный',
        lastName: 'Администратор',
        position: 'Администратор',
        username: 'admin'
      }
    })

    // 6. Create or update System Administrator
    const sysadmin = await prisma.doctor.upsert({
      where: { username: 'sysadmin' },
      update: {},
      create: {
        firstName: 'Системный',
        lastName: 'Администратор',
        position: 'Администратор системы',
        username: 'sysadmin'
      }
    })

    // 2. Create or update Maria Smirnova
    const doc1 = await prisma.doctor.upsert({
      where: { username: 'smirnova' },
      update: {},
      create: {
        firstName: 'Мария',
        lastName: 'Смирнова',
        position: 'Терапевт',
        username: 'smirnova'
      }
    })

    // 2. Create or update Alexander Ivanov
    const doc2 = await prisma.doctor.upsert({
      where: { username: 'ivanov' },
      update: {},
      create: {
        firstName: 'Александр',
        lastName: 'Иванов',
        position: 'Кардиолог',
        username: 'ivanov'
      }
    })

    // 5. Create or update Vasily Petrov
    const doc3 = await prisma.doctor.upsert({
      where: { username: 'petrov' },
      update: {},
      create: {
        firstName: 'Василий',
        lastName: 'Петров',
        position: 'Педиатр',
        username: 'petrov'
      }
    })

    // 3. Assign all existing patients without a doctor to Doctor 1 (Maria Smirnova)
    const unassignedPatients = await prisma.patient.findMany({
      where: {
        doctors: {
          none: {}
        }
      }
    })
    for (const p of unassignedPatients) {
      await prisma.patient.update({
        where: { id: p.id },
        data: {
          doctors: {
            connect: { id: doc1.id }
          }
        }
      })
    }

    // 4. Create a demo patient assigned to Doctor 2 (Alexander Ivanov) if they do not exist
    const ivanovPatientPhone = '+79601112233'
    let elena = await prisma.patient.findUnique({
      where: { phone: ivanovPatientPhone }
    })

    if (!elena) {
      elena = await prisma.patient.create({
        data: {
          firstName: 'Елена',
          lastName: 'Сидорова',
          phone: ivanovPatientPhone,
          email: 'elena@example.com',
          dateOfBirth: new Date('1985-06-15'),
          gender: 'Женский',
          notes: 'Пациент кардиологии. Жалобы на аритмию.',
          doctors: {
            connect: { id: doc2.id }
          },
          medicalRecord: JSON.stringify({
            diagnoses: [
              { id: '1', name: 'Синусовая аритмия', date: '10.05.2026', status: 'ACTIVE' }
            ],
            medications: [
              { id: '1', name: 'Бисопролол 5мг', dosage: '1 таб. утром', period: 'Длительно' }
            ],
            allergies: [],
            appointments: [
              { id: '1', date: '2026-05-20', time: '12:00', doctor: 'Др. Иванов', service: 'Контрольный прием кардиолога', status: 'UPCOMING' }
            ],
            billing: [
              { id: '1', date: '10.05.2026', service: 'Прием кардиолога + ЭКГ', amount: 3500, status: 'PAID' }
            ],
            labs: [
              { id: '1', name: 'Калий (сыворотка)', value: 4.1, unit: 'ммоль/л', reference: '3.5 - 5.1', status: 'NORMAL' }
            ],
            documents: [],
            history: [
              { date: '10.05.2026', desc: 'Установлен диагноз: Синусовая аритмия. Назначен Бисопролол. (Др. Иванов)' }
            ]
          }),
          messengerAccounts: {
            create: [
              { platform: 'TELEGRAM', externalId: 'elena_sidorova_demo' }
            ]
          },
          messages: {
            create: [
              {
                content: 'Здравствуйте, Александр! Бисопролол принимать до еды или после?',
                source: 'TELEGRAM',
                isIncoming: true,
                timestamp: new Date(Date.now() - 3600000)
              },
              {
                content: 'Александр Иванов (Кардиолог): Здравствуйте, Елена! Принимайте утром, независимо от приема пищи, запивая водой.',
                source: 'TELEGRAM',
                isIncoming: false,
                timestamp: new Date()
              }
            ]
          }
        }
      })
    }

    const doctors = await prisma.doctor.findMany({
      include: {
        _count: {
          select: { patients: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Seeding done successfully!',
      doctors
    })
  } catch (err: any) {
    console.error('Seeding endpoint error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
