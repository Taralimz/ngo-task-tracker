import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, canAccessAllOrgs } from '@/lib/auth'
import { TaskStatus, TaskPriority } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const tacticId = parseInt(id)
    const searchParams = request.nextUrl.searchParams

    // Parse filters
    const status = searchParams.get('status') as TaskStatus | null
    const priority = searchParams.get('priority') as TaskPriority | null
    const assigneeId = searchParams.get('assigneeId')
    const kpiId = searchParams.get('kpiId')
    const dueFilter = searchParams.get('dueFilter')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = { tacticId }

    if (status) where.status = status
    if (priority) where.priority = priority
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (assigneeId) {
      where.assignees = { some: { userId: parseInt(assigneeId) } }
    }

    if (kpiId) {
      where.taskKpis = { some: { kpiId: parseInt(kpiId) } }
    }

    if (dueFilter) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (dueFilter === 'overdue') {
        where.dueDate = { lt: today }
        where.status = { not: 'DONE' }
      } else if (dueFilter === 'next7days') {
        const next7 = new Date(today)
        next7.setDate(next7.getDate() + 7)
        where.dueDate = { gte: today, lte: next7 }
      } else if (dueFilter === 'next30days') {
        const next30 = new Date(today)
        next30.setDate(next30.getDate() + 30)
        where.dueDate = { gte: today, lte: next30 }
      }
    }

    // RBAC filtering
    if (!canAccessAllOrgs(user.role)) {
      if (user.role === 'user_org') {
        where.OR = [
          { createdById: user.id },
          { assignees: { some: { userId: user.id } } },
        ]
      }
      // admin_zone: could filter by zone, simplified for now
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        strategy: { select: { id: true, code: true, name: true } },
        tactic: { select: { id: true, code: true, name: true } },
        list: { select: { id: true, name: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
        taskKpis: {
          include: {
            kpi: { select: { id: true, code: true, name: true, unit: true } },
          },
        },
        assignees: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        _count: {
          select: { comments: true, attachments: true, updates: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    })

    // Map progressPercent to progress for frontend compatibility
    const tasksWithProgress = tasks.map(task => ({
      ...task,
      progress: task.progressPercent,
    }))

    return NextResponse.json({ tasks: tasksWithProgress })
  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
