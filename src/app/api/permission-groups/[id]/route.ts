import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/permission-groups/[id] - Get single permission group
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

    const group = await prisma.permissionGroup.findUnique({
      where: { id: parseInt(id) },
      include: {
        users: {
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
          }
        },
        _count: { select: { users: true } }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'ไม่พบกลุ่มสิทธิ์' }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Get permission group error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

// PATCH /api/permission-groups/[id] - Update permission group
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
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขกลุ่มสิทธิ์' }, { status: 403 })
    }

    const { id } = await context.params
    const groupId = parseInt(id)
    const body = await request.json()
    const { name, description, permissions, active } = body

    // Check if group exists
    const existing = await prisma.permissionGroup.findUnique({ where: { id: groupId } })
    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบกลุ่มสิทธิ์' }, { status: 404 })
    }

    // Cannot edit system groups name
    if (existing.isSystem && name && name !== existing.name) {
      return NextResponse.json({ error: 'ไม่สามารถเปลี่ยนชื่อกลุ่มระบบได้' }, { status: 400 })
    }

    // Check duplicate name
    if (name && name !== existing.name) {
      const duplicate = await prisma.permissionGroup.findFirst({
        where: { name: name.trim(), id: { not: groupId } }
      })
      if (duplicate) {
        return NextResponse.json({ error: 'ชื่อกลุ่มสิทธิ์นี้มีอยู่แล้ว' }, { status: 400 })
      }
    }

    // Validate permissions
    const validPermissions = Array.isArray(permissions)
      ? permissions.filter(p => Object.keys(PERMISSIONS).includes(p))
      : undefined

    const group = await prisma.permissionGroup.update({
      where: { id: groupId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(validPermissions && { permissions: validPermissions }),
        ...(active !== undefined && { active })
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

    return NextResponse.json(group)
  } catch (error) {
    console.error('Update permission group error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปเดตกลุ่มสิทธิ์' }, { status: 500 })
  }
}

// DELETE /api/permission-groups/[id] - Delete permission group
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
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ลบกลุ่มสิทธิ์' }, { status: 403 })
    }

    const { id } = await context.params
    const groupId = parseInt(id)

    const group = await prisma.permissionGroup.findUnique({ where: { id: groupId } })
    if (!group) {
      return NextResponse.json({ error: 'ไม่พบกลุ่มสิทธิ์' }, { status: 404 })
    }

    if (group.isSystem) {
      return NextResponse.json({ error: 'ไม่สามารถลบกลุ่มสิทธิ์ระบบได้' }, { status: 400 })
    }

    await prisma.permissionGroup.delete({ where: { id: groupId } })

    return NextResponse.json({ message: 'ลบกลุ่มสิทธิ์สำเร็จ' })
  } catch (error) {
    console.error('Delete permission group error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบกลุ่มสิทธิ์' }, { status: 500 })
  }
}
