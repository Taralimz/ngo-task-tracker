import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, canAccessTask } from '@/lib/auth'
import { notifyTaskAssignees, notifyTaskCreator } from '@/lib/notifications'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1, 'กรุณาระบุข้อความ'),
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
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แสดงความคิดเห็น' }, { status: 403 })
    }

    const body = await request.json()
    const data = createCommentSchema.parse(body)

    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId: user.id,
        body: data.content,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    })

    // Get task title for notification message
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { title: true },
    })

    const taskTitle = task?.title || `#${taskId}`
    const truncatedComment = data.content.length > 50 ? data.content.slice(0, 50) + '...' : data.content

    // Notify assignees
    await notifyTaskAssignees(
      taskId,
      user.id,
      'TASK_COMMENT',
      'ความคิดเห็นใหม่',
      `${user.fullName} แสดงความคิดเห็นในงาน "${taskTitle}": ${truncatedComment}`,
      `/tasks`
    )

    // Notify task creator
    await notifyTaskCreator(
      taskId,
      user.id,
      'TASK_COMMENT',
      'ความคิดเห็นใหม่',
      `${user.fullName} แสดงความคิดเห็นในงาน "${taskTitle}": ${truncatedComment}`,
      `/tasks`
    )
    
    // Return with content field for frontend compatibility
    return NextResponse.json({
      ...comment,
      content: comment.body,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Create comment error:', error)
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

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Map body to content for frontend compatibility
    const commentsWithContent = comments.map(comment => ({
      ...comment,
      content: comment.body,
    }))

    return NextResponse.json(commentsWithContent)
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
