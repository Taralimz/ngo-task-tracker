import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, canAccessTask } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; kpiId: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, kpiId } = await params
    const taskId = parseInt(id)
    const kpiIdNum = parseInt(kpiId)

    // Check access
    const canAccess = await canAccessTask(user, taskId)
    if (!canAccess) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไข' }, { status: 403 })
    }

    // Count current KPIs
    const kpiCount = await prisma.taskKPI.count({ where: { taskId } })
    
    if (kpiCount <= 1) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบได้ - งานต้องมี KPI อย่างน้อย 1 รายการ' },
        { status: 400 }
      )
    }

    // Delete
    await prisma.taskKPI.delete({
      where: { taskId_kpiId: { taskId, kpiId: kpiIdNum } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete KPI error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
