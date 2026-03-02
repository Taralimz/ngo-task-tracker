import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, canAccessAllOrgs, canAccessZone, validateTacticBelongsToStrategy, validateKPIsBelongToTactic } from '@/lib/auth'
import { createNotifications } from '@/lib/notifications'
import { z } from 'zod'
import { TaskPriority, ContributionType } from '@prisma/client'

const createTaskSchema = z.object({
  listId: z.number().optional(),
  orgId: z.number().optional().nullable(),
  strategyId: z.number({ required_error: 'กรุณาเลือกยุทธศาสตร์' }),
  tacticId: z.number({ required_error: 'กรุณาเลือกแผนกลยุทธ์' }),
  title: z.string().min(1, 'กรุณาระบุชื่องาน').max(500),
  description: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeIds: z.array(z.number()).optional(),
  teamIds: z.array(z.number()).optional(),
  kpiLinks: z
    .array(
      z.object({
        kpiId: z.number(),
        contributionType: z.nativeEnum(ContributionType).optional(),
        expectedContributionNote: z.string().optional(),
      })
    )
    .min(1, 'กรุณาเลือก KPI อย่างน้อย 1 รายการ'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createTaskSchema.parse(body)

    // Validate tactic belongs to strategy
    const tacticValid = await validateTacticBelongsToStrategy(data.tacticId, data.strategyId)
    if (!tacticValid) {
      return NextResponse.json(
        { error: 'แผนกลยุทธ์ที่เลือกไม่ตรงกับยุทธศาสตร์' },
        { status: 400 }
      )
    }

    // Validate KPIs belong to tactic
    const kpiIds = data.kpiLinks.map((k) => k.kpiId)
    const kpisValid = await validateKPIsBelongToTactic(kpiIds, data.tacticId)
    if (!kpisValid) {
      return NextResponse.json(
        { error: 'KPI ที่เลือกไม่ตรงกับแผนกลยุทธ์' },
        { status: 400 }
      )
    }

    // Create task with relations - auto-assign orgId from user if not specified
    const taskOrgId = data.orgId !== undefined ? data.orgId : user.orgId

    const task = await prisma.task.create({
      data: {
        listId: data.listId,
        orgId: taskOrgId,
        strategyId: data.strategyId,
        tacticId: data.tacticId,
        title: data.title,
        description: data.description,
        priority: data.priority || TaskPriority.NORMAL,
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdById: user.id,
        taskKpis: {
          create: data.kpiLinks.map((kpi) => ({
            kpiId: kpi.kpiId,
            contributionType: kpi.contributionType || ContributionType.DIRECT,
            expectedContributionNote: kpi.expectedContributionNote,
          })),
        },
        assignees: data.assigneeIds
          ? {
              create: data.assigneeIds.map((userId) => ({ userId })),
            }
          : undefined,
        teamAssignees: data.teamIds
          ? {
              create: data.teamIds.map((teamId) => ({ teamId })),
            }
          : undefined,
      },
      include: {
        strategy: { select: { id: true, code: true, name: true } },
        tactic: { select: { id: true, code: true, name: true } },
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
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'Task',
        entityId: task.id,
        actorUserId: user.id,
        action: 'CREATE',
        afterJson: task,
      },
    })

    // Notify assigned users
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      const assigneeIdsToNotify = data.assigneeIds.filter((id: number) => id !== user.id)
      if (assigneeIdsToNotify.length > 0) {
        await createNotifications(
          assigneeIdsToNotify,
          'TASK_ASSIGNED',
          'คุณได้รับมอบหมายงานใหม่',
          `${user.fullName} มอบหมายงาน "${task.title}" ให้คุณ`,
          `/tasks`
        )
      }
    }

    // Map progressPercent to progress for frontend compatibility
    return NextResponse.json({ ...task, progress: task.progressPercent }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างงาน' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    
    // Filters
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const tacticId = searchParams.get('tacticId')
    const strategyId = searchParams.get('strategyId')
    const orgId = searchParams.get('orgId')

    // Build where clause
    const where: any = {}
    
    // Role-based org scoping
    if (!canAccessAllOrgs(user.role)) {
      if (canAccessZone(user.role) && user.org?.zone) {
        // admin_zone: see tasks from all orgs in same zone + own tasks
        const zoneOrgs = await prisma.org.findMany({
          where: { zone: user.org.zone },
          select: { id: true },
        })
        const zoneOrgIds = zoneOrgs.map(o => o.id)
        where.OR = [
          { orgId: { in: zoneOrgIds } },
          { createdById: user.id },
          { assignees: { some: { userId: user.id } } },
        ]
      } else {
        // user_org: only see tasks from own org + assigned to them
        where.OR = [
          ...(user.orgId ? [{ orgId: user.orgId }] : []),
          { createdById: user.id },
          { assignees: { some: { userId: user.id } } },
        ]
      }
    }
    
    // Additional filters (applied on top of org scoping)
    if (orgId) {
      where.orgId = parseInt(orgId)
    }

    if (status && status !== 'ALL') {
      where.status = status
    }
    
    if (search) {
      // Wrap existing OR conditions with AND
      const searchCondition = {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      }
      if (where.OR) {
        where.AND = [{ OR: where.OR }, searchCondition]
        delete where.OR
      } else {
        where.OR = searchCondition.OR
      }
    }
    
    if (tacticId) {
      where.tacticId = parseInt(tacticId)
    }
    
    if (strategyId) {
      where.strategyId = parseInt(strategyId)
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          strategy: { select: { id: true, code: true, name: true } },
          tactic: { select: { id: true, code: true, name: true } },
          list: { select: { id: true, name: true } },
          org: { select: { id: true, name: true, zone: true } },
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ])

    // Map progressPercent to progress for frontend compatibility
    const tasksWithProgress = tasks.map(task => ({
      ...task,
      progress: task.progressPercent,
    }))

    return NextResponse.json({
      tasks: tasksWithProgress,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
