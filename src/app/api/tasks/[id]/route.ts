import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, canAccessTask } from '@/lib/auth'
import { notifyTaskAssignees, notifyTaskCreator } from '@/lib/notifications'
import { z } from 'zod'
import { TaskStatus, TaskPriority } from '@prisma/client'

const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  progressPercent: z.number().min(0).max(100).optional(),
  listId: z.number().optional().nullable(),
  orgId: z.number().optional().nullable(),
})

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

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        strategy: { select: { id: true, code: true, name: true } },
        tactic: { select: { id: true, code: true, name: true } },
        list: { select: { id: true, name: true } },
        org: { select: { id: true, name: true, zone: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
        taskKpis: {
          include: {
            kpi: { select: { id: true, code: true, name: true, unit: true, frequency: true } },
          },
        },
        assignees: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        updates: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'ไม่พบงาน' }, { status: 404 })
    }

    // Check access
    const canAccess = await canAccessTask(user, taskId)
    if (!canAccess) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 })
    }

    // Get activity logs
    const activityLogs = await prisma.activityLog.findMany({
      where: { entityType: 'Task', entityId: taskId },
      include: {
        actor: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Map comments body to content for frontend compatibility
    const commentsWithContent = task.comments.map(comment => ({
      ...comment,
      content: comment.body,
    }))

    // Map updates to frontend format (content/previousProgress/newProgress)
    const updatesWithContent = task.updates.map((update, index, array) => {
      // Get the previous update to calculate previousProgress
      const nextUpdate = array[index + 1] // Because ordered by desc, next in array is previous in time
      const previousProgress = nextUpdate?.progressPercent ?? null
      
      return {
        ...update,
        content: update.doneNote ?? '',
        previousProgress,
        newProgress: update.progressPercent,
      }
    })

    return NextResponse.json({ 
      ...task, 
      progress: task.progressPercent, // Map for frontend compatibility
      comments: commentsWithContent, 
      updates: updatesWithContent, 
      activityLogs 
    })
  } catch (error) {
    console.error('Get task error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PATCH(
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
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไข' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateTaskSchema.parse(body)

    // Get current task for activity log
    const currentTask = await prisma.task.findUnique({
      where: { id: taskId },
    })

    if (!currentTask) {
      return NextResponse.json({ error: 'ไม่พบงาน' }, { status: 404 })
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.progressPercent !== undefined && { progressPercent: data.progressPercent }),
        ...(data.listId !== undefined && { listId: data.listId }),
        ...(data.orgId !== undefined && { orgId: data.orgId }),
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
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'Task',
        entityId: taskId,
        actorUserId: user.id,
        action: 'UPDATE',
        beforeJson: currentTask,
        afterJson: updatedTask,
      },
    })

    // Notify assignees & creator about task update
    const statusLabels: Record<string, string> = {
      NOT_STARTED: 'ยังไม่เริ่ม',
      IN_PROGRESS: 'กำลังดำเนินการ',
      DONE: 'เสร็จสิ้น',
      CANCELLED: 'ยกเลิก',
    }

    let notifyMessage = `${user.fullName} อัปเดตงาน "${updatedTask.title}"`
    if (data.status && data.status !== currentTask.status) {
      notifyMessage = `${user.fullName} เปลี่ยนสถานะงาน "${updatedTask.title}" เป็น ${statusLabels[data.status] || data.status}`
    } else if (data.progressPercent !== undefined && data.progressPercent !== currentTask.progressPercent) {
      notifyMessage = `${user.fullName} อัปเดตความคืบหน้างาน "${updatedTask.title}" เป็น ${data.progressPercent}%`
    }

    // Notify assignees (excluding the person making the update)
    await notifyTaskAssignees(
      taskId,
      user.id,
      'TASK_UPDATED',
      'งานถูกอัปเดต',
      notifyMessage,
      `/tasks`
    )

    // Also notify the creator if they're not the updater and not an assignee
    await notifyTaskCreator(
      taskId,
      user.id,
      'TASK_UPDATED',
      'งานถูกอัปเดต',
      notifyMessage,
      `/tasks`
    )

    // Map progressPercent to progress for frontend compatibility
    return NextResponse.json({ ...updatedTask, progress: updatedTask.progressPercent })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Update task error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Only superadmin/admin can delete
    if (user.role !== 'superadmin' && user.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ลบ' }, { status: 403 })
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) {
      return NextResponse.json({ error: 'ไม่พบงาน' }, { status: 404 })
    }

    await prisma.task.delete({ where: { id: taskId } })

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'Task',
        entityId: taskId,
        actorUserId: user.id,
        action: 'DELETE',
        beforeJson: task,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete task error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
