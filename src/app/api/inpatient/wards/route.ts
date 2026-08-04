import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        wards: {
          include: {
            beds: {
              include: {
                hospitalizations: {
                  where: {
                    status: 'ADMITTED'
                  },
                  include: {
                    patient: true,
                    doctor: true
                  }
                }
              }
            }
          }
        }
      }
    })
    return NextResponse.json(departments)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Optional POST to seed initial data if needed
export async function POST(req: Request) {
  try {
    // Basic seed logic
    const dept = await prisma.department.create({
      data: {
        name: 'Хирургическое отделение',
        type: 'SURGERY',
        wards: {
          create: [
            {
              number: 'Палата 1 (Мужская)',
              beds: {
                create: [
                  { number: 'Койка 1' },
                  { number: 'Койка 2' },
                  { number: 'Койка 3' }
                ]
              }
            },
            {
              number: 'Палата 2 (Женская)',
              beds: {
                create: [
                  { number: 'Койка 4' },
                  { number: 'Койка 5' }
                ]
              }
            }
          ]
        }
      }
    })
    return NextResponse.json(dept)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
