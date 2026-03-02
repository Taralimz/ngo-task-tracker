import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/permission-groups/[id]/users - Get group users
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const users = await prisma.userPermissionGroup.findMany({
      where: { permissionGroupId: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            active: true,
            org: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Get permission group users error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

// POST /api/permission-groups/[id]/users - Add user to group
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'superadmin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เพิ่มผู้ใช้ในกลุ่มสิทธิ์' }, { status: 403 })
    }

    const { id } = await context.params
    const groupId = parseInt(id)
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'กรุณาระบุผู้ใช้' }, { status: 400 })
    }

    // Check if group exists
    const group = await prisma.permissionGroup.findUnique({ where: { id: groupId } })
    if (!group) {
      return NextResponse.json({ error: 'ไม่พบกลุ่มสิทธิ์' }, { status: 404 })
    }

    // Check if user exists
    const userToAdd = await prisma.user.findUnique({ where: { id: userId } })
    if (!userToAdd) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 })
    }

    // Check if already a member
    const existing = await prisma.userPermissionGroup.findFirst({
      where: { permissionGroupId: groupId, userId }
    })
    if (existing) {
      return NextResponse.json({ error: 'ผู้ใช้อยู่ในกลุ่มสิทธิ์นี้แล้ว' }, { status: 400 })
    }

    const member = await prisma.userPermissionGroup.create({
      data: { permissionGroupId: groupId, userId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true }
        }
      }
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Add user to permission group error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้' }, { status: 500 })
  }
}

// PATCH /api/permission-groups/[id]/users - Bulk update users
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'superadmin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขผู้ใช้ในกลุ่มสิทธิ์' }, { status: 403 })
    }

    const { id } = await context.params
    const groupId = parseInt(id)
    const body = await request.json()
    const { userIds } = body

    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 })
    }

    // Remove all existing users and add new ones
    await prisma.userPermissionGroup.deleteMany({ where: { permissionGroupId: groupId } })

    if (userIds.length > 0) {
      await prisma.userPermissionGroup.createMany({
        data: userIds.map((userId: number) => ({
          permissionGroupId: groupId,
          userId
        }))
      })
    }

    const group = await prisma.permissionGroup.findUnique({
      where: { id: groupId },
      include: {
        users: {
          include: {
            user: { select: { id: true, fullName: true, email: true } }
          }
        },
        _count: { select: { users: true } }
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Update permission group users error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปเดตผู้ใช้' }, { status: 500 })
  }
}

// DELETE /api/permission-groups/[id]/users - Remove user from group
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'superadmin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ลบผู้ใช้จากกลุ่มสิทธิ์' }, { status: 403 })
    }

    const { id } = await context.params
    const groupId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'กรุณาระบุผู้ใช้' }, { status: 400 })
    }

    const result = await prisma.userPermissionGroup.deleteMany({
      where: { permissionGroupId: groupId, userId: parseInt(userId) }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้ในกลุ่มสิทธิ์' }, { status: 404 })
    }

    return NextResponse.json({ message: 'ลบผู้ใช้จากกลุ่มสิทธิ์สำเร็จ' })
  } catch (error) {
    console.error('Remove user from permission group error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบผู้ใช้' }, { status: 500 })
  }
}
