import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Migrating data from WHATSAPP to MAX...')
  
  const updatedMessages = await prisma.message.updateMany({
    where: { source: 'WHATSAPP' },
    data: { source: 'MAX' }
  })
  
  const updatedAccounts = await prisma.messengerAccount.updateMany({
    where: { platform: 'WHATSAPP' },
    data: { platform: 'MAX' }
  })

  console.log(`Updated ${updatedMessages.count} messages and ${updatedAccounts.count} messenger accounts.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
