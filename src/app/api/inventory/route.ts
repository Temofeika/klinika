import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' }
    })
    
    // Calculate stats
    const totalItems = items.length
    const totalValue = 0 // Normally we'd track price per unit
    const lowStockItems = items.filter(i => i.quantity <= i.minQuantity).length

    return NextResponse.json({
      items,
      stats: {
        totalItems,
        lowStockItems
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    if (body.action === 'TRANSACTION') {
      // Create transaction (in/out)
      const { itemId, type, quantity, notes } = body
      
      const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } })
      if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

      const newQty = type === 'IN' ? item.quantity + quantity : item.quantity - quantity

      const transaction = await prisma.inventoryTransaction.create({
        data: {
          itemId,
          type,
          quantity,
          notes
        }
      })

      const updatedItem = await prisma.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: newQty }
      })

      return NextResponse.json({ transaction, item: updatedItem })
    } else {
      // Create new inventory item
      const { sku, name, category, unit, minQuantity, initialQuantity } = body
      
      const item = await prisma.inventoryItem.create({
        data: {
          sku,
          name,
          category,
          unit,
          minQuantity,
          quantity: initialQuantity || 0
        }
      })

      if (initialQuantity > 0) {
        await prisma.inventoryTransaction.create({
          data: {
            itemId: item.id,
            type: 'IN',
            quantity: initialQuantity,
            notes: 'Начальный остаток'
          }
        })
      }

      return NextResponse.json(item)
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
