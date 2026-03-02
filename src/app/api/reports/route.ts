import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/reports/summary - Get summary report
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const strategyId = searchParams.get('strategyId')
    const orgId = searchParams.get('orgId')

    // Task statistics
    const taskWhere: any = {}
    if (strategyId) taskWhere.strategyId = parseInt(strategyId)

    const [
      totalTasks,
      tasksByStatus,
      tasksByStrategy,
      tasksByPriority,
      overdueTasks,
      strategies,
      kpiSummary,
      recentActivity,
    ] = await Promise.all([
      // Total tasks
      prisma.task.count({ where: taskWhere }),
      
      // Tasks by status
      prisma.task.groupBy({
        by: ['status'],
        where: taskWhere,
        _count: true,
      }),
      
      // Tasks by strategy
      prisma.task.groupBy({
        by: ['strategyId'],
        where: taskWhere,
        _count: true,
      }),
      
      // Tasks by priority
      prisma.task.groupBy({
        by: ['priority'],
        where: taskWhere,
        _count: true,
      }),
      
      // Overdue tasks
      prisma.task.count({
        where: {
          ...taskWhere,
          status: { not: 'DONE' },
          dueDate: { lt: new Date() },
        },
      }),
      
      // Strategies with task counts
      prisma.strategy.findMany({
        where: { active: true },
        include: {
          _count: { select: { tasks: true } },
          tactics: {
            include: {
              _count: { select: { tasks: true, kpis: true } },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      }),
      
      // KPI summary
      prisma.kPI.findMany({
        where: { active: true },
        include: {
          tactic: {
            include: { strategy: true },
          },
          values: {
            where: {
              periodYYYYMM: { startsWith: year },
            },
            orderBy: { periodYYYYMM: 'desc' },
          },
        },
      }),
      
      // Recent task updates
      prisma.taskUpdate.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          task: { select: { id: true, title: true } },
          user: { select: { id: true, fullName: true } },
        },
      }),
    ])

    // Calculate KPI achievement
    const kpiAchievement = kpiSummary.map((kpi) => {
      const totalValue = kpi.values.reduce((sum, v) => sum + Number(v.value), 0)
      const target = kpi.targetRuleJson as any
      let targetValue = 0
      let achievementRate = 0

      if (target) {
        if (target.yearly) targetValue = target.yearly
        else if (target.quarterly) targetValue = target.quarterly * 4
        else if (target.monthly) targetValue = target.monthly * 12
        else if (target.target) targetValue = target.target

        if (targetValue > 0) {
          achievementRate = Math.min((totalValue / targetValue) * 100, 100)
        }
      }

      return {
        id: kpi.id,
        code: kpi.code,
        name: kpi.name,
        unit: kpi.unit,
        strategyCode: kpi.tactic.strategy.code,
        tacticCode: kpi.tactic.code,
        currentValue: totalValue,
        targetValue,
        achievementRate: Math.round(achievementRate),
        frequency: kpi.frequency,
      }
    })

    // Strategy summary
    const strategySummary = strategies.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      totalTasks: s._count.tasks,
      totalTactics: s.tactics.length,
      totalKPIs: s.tactics.reduce((sum, t) => sum + t._count.kpis, 0),
    }))

    return NextResponse.json({
      totalTasks,
      tasksByStatus: tasksByStatus.reduce((acc, item) => {
        acc[item.status] = item._count
        return acc
      }, {} as Record<string, number>),
      tasksByPriority: tasksByPriority.reduce((acc, item) => {
        acc[item.priority] = item._count
        return acc
      }, {} as Record<string, number>),
      overdueTasks,
      strategySummary,
      kpiAchievement,
      recentActivity,
    })
  } catch (error) {
    console.error('Failed to generate report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
