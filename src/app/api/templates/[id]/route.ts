import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// PUT: Update an existing template by ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, content } = await request.json()

    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 })
    }

    const template = await prisma.template.update({
      where: { id },
      data: {
        name,
        content
      }
    })

    return NextResponse.json(template)
  } catch (err: any) {
    console.error('Template PUT API error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE: Delete a template by ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const template = await prisma.template.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, deleted: template })
  } catch (err: any) {
    console.error('Template DELETE API error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
