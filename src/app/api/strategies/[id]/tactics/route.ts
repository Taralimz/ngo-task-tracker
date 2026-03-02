import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

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
    const strategyId = parseInt(id)

    const tactics = await prisma.tactic.findMany({
      where: { strategyId, active: true },
      include: {
        kpis: {
          where: { active: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(tactics)
  } catch (error) {
    console.error('Get tactics error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
