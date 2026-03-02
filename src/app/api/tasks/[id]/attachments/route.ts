import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, canAccessTask } from '@/lib/auth'
import { z } from 'zod'

const createAttachmentSchema = z.object({
  url: z.string().url('URL ไม่ถูกต้อง'),
  label: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
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
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แนบไฟล์' }, { status: 403 })
    }

    const body = await request.json()
    const data = createAttachmentSchema.parse(body)

    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        userId: user.id,
        url: data.url,
        label: data.label,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Create attachment error:', error)
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

    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Get attachments error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
