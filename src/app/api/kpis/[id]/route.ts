import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/kpis/[id] - Get single KPI with values
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id)

    const kpi = await prisma.kPI.findUnique({
      where: { id },
      include: {
        tactic: {
          include: { strategy: true },
        },
        values: {
          orderBy: { periodYYYYMM: 'desc' },
          include: {
            org: true,
            createdBy: {
              select: { id: true, fullName: true },
            },
          },
        },
        taskKpis: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                progressPercent: true,
              },
            },
          },
        },
      },
    })

    if (!kpi) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 })
    }

    return NextResponse.json(kpi)
  } catch (error) {
    console.error('Failed to fetch KPI:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/kpis/[id] - Update KPI
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const id = parseInt(params.id)
    const body = await request.json()

    const kpi = await prisma.kPI.update({
      where: { id },
      data: body,
      include: {
        tactic: {
          include: { strategy: true },
        },
      },
    })

    return NextResponse.json(kpi)
  } catch (error) {
    console.error('Failed to update KPI:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/kpis/[id] - Soft delete KPI
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const id = parseInt(params.id)

    await prisma.kPI.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete KPI:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
