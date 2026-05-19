import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    console.log('Clearing database patients, history and accounts...')

    // 1. Delete all messages
    const deletedMessages = await prisma.message.deleteMany({})
    
    // 2. Delete all messenger accounts
    const deletedMessengerAccounts = await prisma.messengerAccount.deleteMany({})
    
    // 3. Delete all patients (this also deletes all clinical records, history, and documents inside the patient)
    const deletedPatients = await prisma.patient.deleteMany({})

    return NextResponse.json({
      success: true,
      message: 'База данных успешно очищена! Все пациенты, сообщения и документы удалены.',
      stats: {
        deletedPatientsCount: deletedPatients.count,
        deletedMessagesCount: deletedMessages.count,
        deletedAccountsCount: deletedMessengerAccounts.count
      }
    })
  } catch (err: any) {
    console.error('Clearing endpoint error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
