import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, canAccessTask } from '@/lib/auth'
import { z } from 'zod'
import { TaskStatus } from '@prisma/client'

// Schema accepts both frontend format (content/newProgress) and full format
const createUpdateSchema = z.object({
  // Frontend simple format
  content: z.string().optional(),
  newProgress: z.number().min(0).max(100).optional(),
  // Full format (optional)
  status: z.nativeEnum(TaskStatus).optional(),
  progressPercent: z.number().min(0).max(100).optional(),
  doneNote: z.string().optional(),
  issueNote: z.string().optional(),
  nextStep: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const taskId = parseInt(id)

    // Check access
    const canAccess = await canAccessTask(user, taskId)
    if (!canAccess) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์อัพเดต' }, { status: 403 })
    }

    // Get current task to capture previous progress
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true, progressPercent: true },
    })

    if (!currentTask) {
      return NextResponse.json({ error: 'ไม่พบงาน' }, { status: 404 })
    }

    const body = await request.json()
    const data = createUpdateSchema.parse(body)

    // Map frontend format to database format
    const previousProgress = currentTask.progressPercent
    const newProgressValue = data.newProgress ?? data.progressPercent ?? previousProgress
    const statusValue = data.status ?? currentTask.status
    const contentValue = data.content ?? data.doneNote ?? ''

    // Create update and update task in transaction
    const [taskUpdate, updatedTask] = await prisma.$transaction([
      prisma.taskUpdate.create({
        data: {
          taskId,
          userId: user.id,
          status: statusValue,
          progressPercent: newProgressValue,
          doneNote: contentValue,
          issueNote: data.issueNote,
          nextStep: data.nextStep,
        },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      }),
      prisma.task.update({
        where: { id: taskId },
        data: {
          status: statusValue,
          progressPercent: newProgressValue,
        },
      }),
    ])

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'Task',
        entityId: taskId,
        actorUserId: user.id,
        action: 'STATUS_UPDATE',
        afterJson: { status: statusValue, progressPercent: newProgressValue },
      },
    })

    // Return with frontend-compatible format
    return NextResponse.json({
      ...taskUpdate,
      content: taskUpdate.doneNote ?? '',
      previousProgress,
      newProgress: newProgressValue,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Create update error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

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
    const taskId = parseInt(id)

    const updates = await prisma.taskUpdate.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(updates)
  } catch (error) {
    console.error('Get updates error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
