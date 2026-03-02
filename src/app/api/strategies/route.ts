import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const strategies = await prisma.strategy.findMany({
      include: {
        tactics: {
          orderBy: { sortOrder: 'asc' },
          include: {
            kpis: {
              orderBy: { sortOrder: 'asc' },
              include: {
                _count: { select: { values: true, taskKpis: true } },
              },
            },
            tasks: {
              select: { id: true, status: true, progressPercent: true, dueDate: true },
            },
            _count: {
              select: { tasks: true, kpis: true },
            },
          },
        },
        tasks: {
          select: { id: true, status: true, progressPercent: true, dueDate: true },
        },
        _count: {
          select: { tasks: true, tactics: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    // Compute stats for each strategy and tactic
    const now = new Date()
    const enriched = strategies.map((strategy) => {
      const sTasks = strategy.tasks
      const sTaskStats = {
        total: sTasks.length,
        todo: sTasks.filter((t) => t.status === 'TO_DO').length,
        inProgress: sTasks.filter((t) => t.status === 'IN_PROGRESS').length,
        done: sTasks.filter((t) => t.status === 'DONE').length,
        blocked: sTasks.filter((t) => t.status === 'BLOCKED').length,
        overdue: sTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE').length,
        avgProgress: sTasks.length > 0
          ? Math.round(sTasks.reduce((sum, t) => sum + t.progressPercent, 0) / sTasks.length)
          : 0,
      }

      const enrichedTactics = strategy.tactics.map((tactic) => {
        const tTasks = tactic.tasks
        const tTaskStats = {
          total: tTasks.length,
          todo: tTasks.filter((t) => t.status === 'TO_DO').length,
          inProgress: tTasks.filter((t) => t.status === 'IN_PROGRESS').length,
          done: tTasks.filter((t) => t.status === 'DONE').length,
          blocked: tTasks.filter((t) => t.status === 'BLOCKED').length,
          overdue: tTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE').length,
          avgProgress: tTasks.length > 0
            ? Math.round(tTasks.reduce((sum, t) => sum + t.progressPercent, 0) / tTasks.length)
            : 0,
        }

        const { tasks: _tTasks, ...tacticRest } = tactic
        return { ...tacticRest, taskStats: tTaskStats }
      })

      const { tasks: _sTasks, ...strategyRest } = strategy
      return { ...strategyRest, tactics: enrichedTactics, taskStats: sTaskStats }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Get strategies error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { code, name, description } = body

    if (!code || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if code already exists
    const existing = await prisma.strategy.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: 'รหัสยุทธศาสตร์ซ้ำ' }, { status: 400 })
    }

    // Get max sortOrder
    const maxSort = await prisma.strategy.findFirst({ orderBy: { sortOrder: 'desc' } })

    const strategy = await prisma.strategy.create({
      data: {
        code,
        name,
        description,
        sortOrder: (maxSort?.sortOrder || 0) + 1,
      },
    })

    return NextResponse.json(strategy, { status: 201 })
  } catch (error) {
    console.error('Create strategy error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
