import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/tactics - Get all tactics
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get('strategyId')

    const where: Record<string, unknown> = { active: true }
    
    if (strategyId) {
      where.strategyId = parseInt(strategyId)
    }

    const tactics = await prisma.tactic.findMany({
      where,
      include: {
        strategy: {
          select: { id: true, name: true, code: true }
        },
        kpis: {
          where: { active: true },
          select: { id: true, name: true, code: true }
        },
        _count: {
          select: { tasks: true, kpis: true }
        }
      },
      orderBy: { code: 'asc' }
    })

    return NextResponse.json(tactics)
  } catch (error) {
    console.error('Error fetching tactics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tactics' },
      { status: 500 }
    )
  }
}

// POST /api/tactics - Create new tactic
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only superadmin and admin can create tactics
    if (!['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, description, strategyId } = body

    if (!name || !strategyId) {
      return NextResponse.json(
        { error: 'Name and strategyId are required' },
        { status: 400 }
      )
    }

    // Verify strategy exists
    const strategy = await prisma.strategy.findUnique({
      where: { id: strategyId }
    })

    if (!strategy || !strategy.active) {
      return NextResponse.json(
        { error: 'Strategy not found' },
        { status: 404 }
      )
    }

    const tactic = await prisma.tactic.create({
      data: {
        name,
        code: code || `T-${Date.now()}`,
        description: description || null,
        strategyId
      },
      include: {
        strategy: {
          select: { id: true, name: true, code: true }
        }
      }
    })

    return NextResponse.json(tactic, { status: 201 })
  } catch (error) {
    console.error('Error creating tactic:', error)
    return NextResponse.json(
      { error: 'Failed to create tactic' },
      { status: 500 }
    )
  }
}
