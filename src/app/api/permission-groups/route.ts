import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'

// GET /api/permission-groups - Get all permission groups
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeUsers = searchParams.get('includeUsers') === 'true'
    const activeOnly = searchParams.get('active') !== 'false'

    const where: Record<string, unknown> = {}
    if (activeOnly) {
      where.active = true
    }

    const groups = await prisma.permissionGroup.findMany({
      where,
      include: {
        users: includeUsers ? {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, role: true }
            }
          }
        } : false,
        _count: {
          select: { users: true }
        }
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Get permission groups error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

// GET /api/permission-groups/permissions - Get available permissions list
export async function HEAD() {
  return NextResponse.json(PERMISSIONS)
}

// POST /api/permission-groups - Create new permission group
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'superadmin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์สร้างกลุ่มสิทธิ์' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, permissions, userIds } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อกลุ่มสิทธิ์' }, { status: 400 })
    }

    // Check duplicate name
    const existing = await prisma.permissionGroup.findUnique({
      where: { name: name.trim() }
    })

    if (existing) {
      return NextResponse.json({ error: 'ชื่อกลุ่มสิทธิ์นี้มีอยู่แล้ว' }, { status: 400 })
    }

    // Validate permissions
    const validPermissions = Array.isArray(permissions) 
      ? permissions.filter(p => Object.keys(PERMISSIONS).includes(p))
      : []

    const group = await prisma.permissionGroup.create({
      data: {
        name: name.trim(),
        description: description || null,
        permissions: validPermissions,
        users: userIds && userIds.length > 0 ? {
          create: userIds.map((userId: number) => ({ userId }))
        } : undefined
      },
      include: {
        users: {
          include: {
            user: { select: { id: true, fullName: true, email: true } }
          }
        },
        _count: { select: { users: true } }
      }
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Create permission group error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างกลุ่มสิทธิ์' }, { status: 500 })
  }
}
