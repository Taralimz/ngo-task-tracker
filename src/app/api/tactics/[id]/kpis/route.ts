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
    const tacticId = parseInt(id)

    const kpis = await prisma.kPI.findMany({
      where: { tacticId, active: true },
      include: {
        tactic: {
          include: { strategy: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(kpis)
  } catch (error) {
    console.error('Get KPIs error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
