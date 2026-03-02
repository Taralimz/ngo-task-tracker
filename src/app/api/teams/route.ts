import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET /api/teams - Get all teams
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const activeOnly = searchParams.get('active') !== 'false'
    const includeMembers = searchParams.get('includeMembers') === 'true'

    const where: Record<string, unknown> = {}

    if (activeOnly) {
      where.active = true
    }

    if (search) {
      where.name = { contains: search }
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        members: includeMembers ? {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, role: true }
            }
          }
        } : false,
        _count: {
          select: { members: true, taskAssignments: true }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Get teams error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

// POST /api/teams - Create new team
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์สร้างทีม' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, color, isDefault, memberIds } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อทีม' }, { status: 400 })
    }

    // Check duplicate name
    const existing = await prisma.team.findFirst({
      where: { name: name.trim() }
    })

    if (existing) {
      return NextResponse.json({ error: 'ชื่อทีมนี้มีอยู่แล้ว' }, { status: 400 })
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description || null,
        color: color || '#3B82F6',
        isDefault: isDefault || false,
        members: memberIds && memberIds.length > 0 ? {
          create: memberIds.map((userId: number, index: number) => ({
            userId,
            role: index === 0 ? 'leader' : 'member'
          }))
        } : undefined
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true }
            }
          }
        },
        _count: {
          select: { members: true, taskAssignments: true }
        }
      }
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Create team error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างทีม' }, { status: 500 })
  }
}
