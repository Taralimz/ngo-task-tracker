import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/tactics/[id] - Get single tactic
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const tacticId = parseInt(id)

    const tactic = await prisma.tactic.findFirst({
      where: { id: tacticId, active: true },
      include: {
        strategy: {
          select: { id: true, name: true, code: true }
        },
        kpis: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            code: true,
            unit: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true
          }
        }
      }
    })

    if (!tactic) {
      return NextResponse.json({ error: 'Tactic not found' }, { status: 404 })
    }

    return NextResponse.json(tactic)
  } catch (error) {
    console.error('Error fetching tactic:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tactic' },
      { status: 500 }
    )
  }
}

// PATCH /api/tactics/[id] - Update tactic
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmin and admin can update tactics
    if (!['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params
    const tacticId = parseInt(id)
    const body = await request.json()
    const { name, code, description, strategyId, active } = body

    // If changing strategy, verify new strategy exists
    if (strategyId) {
      const strategy = await prisma.strategy.findUnique({
        where: { id: strategyId }
      })

      if (!strategy || !strategy.active) {
        return NextResponse.json(
          { error: 'Strategy not found' },
          { status: 404 }
        )
      }
    }

    const tactic = await prisma.tactic.update({
      where: { id: tacticId },
      data: {
        ...(name && { name }),
        ...(code !== undefined && { code }),
        ...(description !== undefined && { description }),
        ...(strategyId && { strategyId }),
        ...(active !== undefined && { active })
      },
      include: {
        strategy: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    return NextResponse.json(tactic)
  } catch (error) {
    console.error('Error updating tactic:', error)
    return NextResponse.json(
      { error: 'Failed to update tactic' },
      { status: 500 }
    )
  }
}

// DELETE /api/tactics/[id] - Soft delete tactic (set active = false)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmin and admin can delete tactics
    if (!['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params
    const tacticId = parseInt(id)

    await prisma.tactic.update({
      where: { id: tacticId },
      data: { active: false }
    })

    return NextResponse.json({ message: 'Tactic deleted successfully' })
  } catch (error) {
    console.error('Error deleting tactic:', error)
    return NextResponse.json(
      { error: 'Failed to delete tactic' },
      { status: 500 }
    )
  }
}
