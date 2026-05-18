import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({
      orderBy: {
        lastName: 'asc'
      }
    })
    return NextResponse.json(doctors)
  } catch (err: any) {
    console.error('Doctors API error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
