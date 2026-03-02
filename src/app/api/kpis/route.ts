import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/kpis - List all KPIs with optional filters
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tacticId = searchParams.get('tacticId')
    const strategyId = searchParams.get('strategyId')
    const frequency = searchParams.get('frequency')
    const search = searchParams.get('search')

    const where: any = { active: true }

    if (tacticId) {
      where.tacticId = parseInt(tacticId)
    }

    if (strategyId) {
      where.tactic = { strategyId: parseInt(strategyId) }
    }

    if (frequency) {
      where.frequency = frequency
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ]
    }

    const kpis = await prisma.kPI.findMany({
      where,
      include: {
        tactic: {
          include: {
            strategy: true,
          },
        },
        values: {
          orderBy: { periodYYYYMM: 'desc' },
          take: 12,
          include: {
            org: true,
            createdBy: {
              select: { id: true, fullName: true },
            },
          },
        },
        _count: {
          select: { taskKpis: true },
        },
      },
      orderBy: [
        { tactic: { strategy: { sortOrder: 'asc' } } },
        { tactic: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
      ],
    })

    return NextResponse.json(kpis)
  } catch (error) {
    console.error('Failed to fetch KPIs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/kpis - Create new KPI
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin and superadmin can create KPIs
    if (!['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { tacticId, code, name, unit, frequency, definition, targetRuleJson } = body

    if (!tacticId || !code || !name || !unit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if code already exists
    const existing = await prisma.kPI.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: 'KPI code already exists' }, { status: 400 })
    }

    const kpi = await prisma.kPI.create({
      data: {
        tacticId,
        code,
        name,
        unit,
        frequency: frequency || 'monthly',
        definition,
        targetRuleJson,
      },
      include: {
        tactic: {
          include: { strategy: true },
        },
      },
    })

    return NextResponse.json(kpi, { status: 201 })
  } catch (error) {
    console.error('Failed to create KPI:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
