import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, canAccessTask, validateKPIsBelongToTactic } from '@/lib/auth'
import { z } from 'zod'
import { ContributionType } from '@prisma/client'

const addKPISchema = z.object({
  kpiId: z.number(),
  contributionType: z.nativeEnum(ContributionType).optional(),
  expectedContributionNote: z.string().optional(),
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
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไข' }, { status: 403 })
    }

    const body = await request.json()
    const data = addKPISchema.parse(body)

    // Get task to validate KPI belongs to same tactic
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { tacticId: true },
    })

    if (!task) {
      return NextResponse.json({ error: 'ไม่พบงาน' }, { status: 404 })
    }

    // Validate KPI belongs to tactic
    const kpiValid = await validateKPIsBelongToTactic([data.kpiId], task.tacticId)
    if (!kpiValid) {
      return NextResponse.json(
        { error: 'KPI ที่เลือกไม่ตรงกับแผนกลยุทธ์ของงาน' },
        { status: 400 }
      )
    }

    // Check if already linked
    const existing = await prisma.taskKPI.findUnique({
      where: { taskId_kpiId: { taskId, kpiId: data.kpiId } },
    })

    if (existing) {
      return NextResponse.json({ error: 'KPI นี้เชื่อมต่อกับงานอยู่แล้ว' }, { status: 400 })
    }

    const taskKpi = await prisma.taskKPI.create({
      data: {
        taskId,
        kpiId: data.kpiId,
        contributionType: data.contributionType || ContributionType.DIRECT,
        expectedContributionNote: data.expectedContributionNote,
      },
      include: {
        kpi: { select: { id: true, code: true, name: true, unit: true } },
      },
    })

    return NextResponse.json(taskKpi, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Add KPI error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
