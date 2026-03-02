import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const orgId = searchParams.get('orgId')
    const role = searchParams.get('role')
    const activeOnly = searchParams.get('active') !== 'false'

    const where: any = {}
    
    if (activeOnly) {
      where.active = true
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
      ]
    }

    if (orgId) {
      where.orgId = parseInt(orgId)
    }

    if (role) {
      where.role = role
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        orgId: true,
        active: true,
        createdAt: true,
        org: {
          select: { id: true, name: true },
        },
        _count: {
          select: { taskAssignments: true },
        },
      },
      orderBy: { fullName: 'asc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

// POST /api/users - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, fullName, role, orgId } = body

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' }, { status: 400 })
    }

    // Only superadmin can create superadmin or admin
    if (['superadmin', 'admin'].includes(role) && user.role !== 'superadmin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์สร้างผู้ดูแลระบบ' }, { status: 403 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: role || 'user_org',
        orgId: orgId || null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        orgId: true,
        active: true,
        createdAt: true,
        org: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
