import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.message.deleteMany({})
  await prisma.messengerAccount.deleteMany({})
  await prisma.patient.deleteMany({})

  // Create test patient
  const patient = await prisma.patient.create({
    data: {
      firstName: 'Иван',
      lastName: 'Петров',
      phone: '+79991234567',
      email: 'ivan@example.com',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'Мужской',
      notes: 'Пациент с хроническим гастритом. Предпочитает общение в Telegram.',
      messengerAccounts: {
        create: [
          { platform: 'TELEGRAM', externalId: 'ivan_p' },
          { platform: 'WHATSAPP', externalId: '79991234567' }
        ]
      },
      messages: {
        create: [
          {
            content: 'Добрый день! Хотел уточнить время приема.',
            source: 'TELEGRAM',
            isIncoming: true,
            timestamp: new Date(Date.now() - 3600000 * 24) // 1 day ago
          },
          {
            content: 'Здравствуйте, Иван! Ваш прием завтра в 10:00.',
            source: 'TELEGRAM',
            isIncoming: false,
            timestamp: new Date(Date.now() - 3600000 * 23)
          },
          {
            content: 'Спасибо, буду вовремя.',
            source: 'TELEGRAM',
            isIncoming: true,
            timestamp: new Date(Date.now() - 3600000 * 22)
          },
          {
            content: 'Пришлите, пожалуйста, результаты анализов в WhatsApp.',
            source: 'WHATSAPP',
            isIncoming: false,
            timestamp: new Date(Date.now() - 3600000 * 2)
          },
          {
            content: 'Отправил файл.',
            source: 'WHATSAPP',
            isIncoming: true,
            timestamp: new Date(Date.now() - 3600000)
          }
        ]
      }
    }
  })

  console.log({ patient })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
