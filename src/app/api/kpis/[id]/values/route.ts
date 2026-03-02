import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/kpis/[id]/values - Get KPI values
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const kpiId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const orgId = searchParams.get('orgId')

    const where: any = { kpiId }

    if (year) {
      where.periodYYYYMM = { startsWith: year }
    }

    if (orgId) {
      where.orgId = parseInt(orgId)
    }

    const values = await prisma.kPIValue.findMany({
      where,
      include: {
        org: true,
        createdBy: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { periodYYYYMM: 'desc' },
    })

    return NextResponse.json(values)
  } catch (error) {
    console.error('Failed to fetch KPI values:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/kpis/[id]/values - Add KPI value
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const kpiId = parseInt(params.id)
    const body = await request.json()
    const { orgId, province, periodYYYYMM, value, note } = body

    if (!periodYYYYMM || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if value already exists for this period and org
    const existing = await prisma.kPIValue.findFirst({
      where: {
        kpiId,
        orgId: orgId || null,
        periodYYYYMM,
      },
    })

    let kpiValue
    if (existing) {
      // Update existing value
      kpiValue = await prisma.kPIValue.update({
        where: { id: existing.id },
        data: {
          value,
          note,
        },
        include: {
          org: true,
          createdBy: {
            select: { id: true, fullName: true },
          },
        },
      })
    } else {
      // Create new value
      kpiValue = await prisma.kPIValue.create({
        data: {
          kpiId,
          orgId,
          province,
          periodYYYYMM,
          value,
          note,
          createdById: user.id,
        },
        include: {
          org: true,
          createdBy: {
            select: { id: true, fullName: true },
          },
        },
      })
    }

    return NextResponse.json(kpiValue, { status: existing ? 200 : 201 })
  } catch (error) {
    console.error('Failed to add KPI value:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
