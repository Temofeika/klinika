import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database for MIS Klinika...')

  // Clear existing
  await prisma.payment.deleteMany({})
  await prisma.invoiceItem.deleteMany({})
  await prisma.invoice.deleteMany({})
  await prisma.labResult.deleteMany({})
  await prisma.labOrder.deleteMany({})
  await prisma.eMRRecord.deleteMany({})
  await prisma.appointment.deleteMany({})
  await prisma.doctorSchedule.deleteMany({})
  await prisma.message.deleteMany({})
  await prisma.messengerAccount.deleteMany({})
  await prisma.patient.deleteMany({})
  await prisma.doctor.deleteMany({})
  await prisma.service.deleteMany({})

  // 1. Create Doctors
  const doctor1 = await prisma.doctor.create({
    data: {
      firstName: 'Александр',
      lastName: 'Иванов',
      position: 'Терапевт / Врач общей практики',
      username: 'dr_ivanov',
      room: '101',
      color: '#3B82F6',
    }
  })

  const doctor2 = await prisma.doctor.create({
    data: {
      firstName: 'Елена',
      lastName: 'Смирнова',
      position: 'Кардиолог',
      username: 'dr_smirnova',
      room: '204',
      color: '#10B981',
    }
  })

  const doctor3 = await prisma.doctor.create({
    data: {
      firstName: 'Дмитрий',
      lastName: 'Соколов',
      position: 'Невролог',
      username: 'dr_sokolov',
      room: '305',
      color: '#8B5CF6',
    }
  })

  // 2. Create Services Catalog (NMU code standards)
  const service1 = await prisma.service.create({
    data: {
      code: 'B01.047.001',
      name: 'Первичный прием врача-терапевта',
      price: 2500,
      duration: 30,
      category: 'Прием врача',
      description: 'Осмотр, сбор анамнеза, составление плана обследования'
    }
  })

  const service2 = await prisma.service.create({
    data: {
      code: 'B01.015.001',
      name: 'Прием врача-кардиолога с ЭКГ',
      price: 3800,
      duration: 45,
      category: 'Прием врача',
      description: 'Консультация кардиолога + снятие и расшифровка ЭКГ'
    }
  })

  const service3 = await prisma.service.create({
    data: {
      code: 'A12.06.001',
      name: 'Клинический анализ крови с лейкоформулой',
      price: 950,
      duration: 15,
      category: 'Лаборатория',
      description: 'Общий анализ крови (OAK), СОЭ, лейкоцитарная формула'
    }
  })

  const service4 = await prisma.service.create({
    data: {
      code: 'A12.06.002',
      name: 'Биохимический анализ крови (расширенный)',
      price: 2400,
      duration: 15,
      category: 'Лаборатория',
      description: 'Глюкоза, холестерин, АЛТ, АСТ, билирубин, креатинин'
    }
  })

  const service5 = await prisma.service.create({
    data: {
      code: 'A04.10.002',
      name: 'УЗИ сердца (Эхокардиография)',
      price: 4200,
      duration: 30,
      category: 'УЗИ / Диагностика',
      description: 'Ультразвуковое исследование сердца и магистральных сосудов'
    }
  })

  // 3. Create Patients
  const patient1 = await prisma.patient.create({
    data: {
      firstName: 'Иван',
      lastName: 'Петров',
      phone: '+79991234567',
      email: 'ivan.petrov@example.com',
      dateOfBirth: new Date('1988-05-14'),
      gender: 'Мужской',
      notes: 'Пациент с периодическими болями в области желудка.',
      balance: 1500,
      messengerAccounts: {
        create: [
          { platform: 'TELEGRAM', externalId: 'ivan_p' },
          { platform: 'WHATSAPP', externalId: '+79991234567' }
        ]
      },
      messages: {
        create: [
          {
            content: 'Добрый день! Подскажите, свободна ли запись к терапевту на завтра?',
            source: 'TELEGRAM',
            isIncoming: true,
            timestamp: new Date(Date.now() - 3600000 * 24)
          },
          {
            content: 'Здравствуйте, Иван! Да, запишем вас на 10:00 к доктору Иванову А.',
            source: 'TELEGRAM',
            isIncoming: false,
            timestamp: new Date(Date.now() - 3600000 * 23)
          }
        ]
      }
    }
  })

  const patient2 = await prisma.patient.create({
    data: {
      firstName: 'Анна',
      lastName: 'Сидорова',
      phone: '+79169876543',
      email: 'sidorova.a@example.com',
      dateOfBirth: new Date('1994-11-22'),
      gender: 'Женский',
      notes: 'ДМС АльфаСтрахование.',
      balance: 0,
      messengerAccounts: {
        create: [
          { platform: 'TELEGRAM', externalId: 'anna_sid' }
        ]
      }
    }
  })

  // 4. Create Appointments
  const now = new Date()
  const todayAt10 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0)
  const todayAt1030 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30)
  const todayAt11 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0)
  const todayAt1145 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 45)

  const appointment1 = await prisma.appointment.create({
    data: {
      startTime: todayAt10,
      endTime: todayAt1030,
      status: 'IN_PROGRESS',
      room: '101',
      notes: 'Жалобы на изжогу и дискомфорт в эпигастрии',
      patientId: patient1.id,
      doctorId: doctor1.id,
      serviceId: service1.id
    }
  })

  const appointment2 = await prisma.appointment.create({
    data: {
      startTime: todayAt11,
      endTime: todayAt1145,
      status: 'BOOKED',
      room: '204',
      notes: 'Плановый осмотр кардиолога',
      patientId: patient2.id,
      doctorId: doctor2.id,
      serviceId: service2.id
    }
  })

  // 5. Create EMR Record for Patient 1
  await prisma.eMRRecord.create({
    data: {
      dateTime: new Date(Date.now() - 3600000 * 48), // 2 days ago
      complaints: 'Боли в эпигастральной области после приема острой пищи, тошнота.',
      anamnesis: 'Считает себя больным около 2 недель. Ранее аналогичные симптомы отмечались 2 года назад.',
      objective: 'Состояние удовлетворительное. Живот при пальпации мягкий, болезненный в эпигастрии. Симптомов раздражения брюшины нет.',
      icd10Code: 'K29.5',
      icd10Name: 'Хронический гастрит неуточненный',
      treatmentPlan: 'Диета №1. Омепразол 20 мг 2 раза в день 14 дней. Фосфалюгель 1 саше 3 раза в день при болях.',
      prescriptions: 'Омепразол 20мг №28, Фосфалюгель 20г №20.',
      signedBy: 'Врач-терапевт Иванов А. (ЭП №774910293)',
      patientId: patient1.id,
      doctorId: doctor1.id,
      appointmentId: appointment1.id
    }
  })

  // 6. Create Lab Order and Lab Results for Patient 1
  const labOrder1 = await prisma.labOrder.create({
    data: {
      orderDate: new Date(Date.now() - 3600000 * 24),
      status: 'COMPLETED',
      notes: 'Контроль биохимии и общего анализа крови',
      patientId: patient1.id,
      doctorId: doctor1.id,
      serviceId: service3.id,
      results: {
        create: [
          {
            parameterName: 'Гемоглобин',
            value: '142',
            unit: 'г/л',
            referenceRange: '130 - 160',
            isAbnormal: false
          },
          {
            parameterName: 'Лейкоциты',
            value: '6.8',
            unit: '10^9/л',
            referenceRange: '4.0 - 9.0',
            isAbnormal: false
          },
          {
            parameterName: 'СОЭ (Скорость оседания эритроцитов)',
            value: '22',
            unit: 'мм/ч',
            referenceRange: '2 - 15',
            isAbnormal: true,
            notes: 'Умеренно повышено'
          },
          {
            parameterName: 'Глюкоза крови',
            value: '5.1',
            unit: 'ммоль/л',
            referenceRange: '3.3 - 5.5',
            isAbnormal: false
          }
        ]
      }
    }
  })

  // 7. Create Invoice and Payment for Patient 1
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0042',
      totalAmount: 3450,
      status: 'PAID',
      patientId: patient1.id,
      items: {
        create: [
          {
            serviceName: 'Первичный прием врача-терапевта',
            price: 2500,
            quantity: 1,
            amount: 2500,
            serviceId: service1.id
          },
          {
            serviceName: 'Клинический анализ крови с лейкоформулой',
            price: 950,
            quantity: 1,
            amount: 950,
            serviceId: service3.id
          }
        ]
      },
      payments: {
        create: [
          {
            amount: 3450,
            paymentMethod: 'CARD',
            notes: 'Оплата картой через терминал №1'
          }
        ]
      }
    }
  })

  console.log('Seed completed successfully!')
  console.log({
    doctors: [doctor1.lastName, doctor2.lastName, doctor3.lastName],
    servicesCount: 5,
    patient: patient1.lastName,
    appointment: appointment1.id,
    labOrder: labOrder1.id,
    invoice: invoice1.invoiceNumber
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
