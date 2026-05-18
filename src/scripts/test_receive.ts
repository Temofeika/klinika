import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testReceive() {
  const platform = 'TELEGRAM'
  const externalId = 'ivan_p'
  const content = 'Test message'

  try {
    const account = await prisma.messengerAccount.findUnique({
      where: {
        platform_externalId: { platform, externalId }
      },
      include: { patient: true }
    })

    if (!account) {
      console.log('Account not found')
      return
    }

    console.log('Account found:', account.id)

    const result = await prisma.$transaction([
      prisma.message.create({
        data: {
          content,
          source: platform,
          isIncoming: true,
          isRead: false,
          patientId: account.patientId
        }
      }),
      prisma.patient.update({
        where: { id: account.patientId },
        data: { lastMessageAt: new Date() }
      })
    ])

    console.log('Transaction success:', result[0].id)
  } catch (err) {
    console.error('Transaction failed:', err)
  }
}

testReceive()
