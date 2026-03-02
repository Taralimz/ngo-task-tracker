import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getAuthUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id)

    const user = await prisma.user.findUnique({
      where: { id },
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
          select: { taskAssignments: true, tasksCreated: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getAuthUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id)
    const body = await request.json()
    const { email, password, fullName, role, orgId, active } = body

    // Users can only update their own profile (except admins)
    const isAdmin = ['superadmin', 'admin'].includes(currentUser.role)
    if (!isAdmin && currentUser.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Non-admins cannot change role or active status
    if (!isAdmin && (role !== undefined || active !== undefined)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only superadmin can change role to admin/superadmin
    if (['superadmin', 'admin'].includes(role) && currentUser.role !== 'superadmin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เปลี่ยนบทบาทเป็นผู้ดูแลระบบ' }, { status: 403 })
    }

    const updateData: any = {}
    if (email) updateData.email = email
    if (fullName) updateData.fullName = fullName
    if (role !== undefined) updateData.role = role
    if (orgId !== undefined) updateData.orgId = orgId
    if (active !== undefined) updateData.active = active
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Soft delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getAuthUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['superadmin', 'admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const id = parseInt(params.id)

    // Cannot delete yourself
    if (currentUser.id === id) {
      return NextResponse.json({ error: 'ไม่สามารถลบบัญชีตัวเอง' }, { status: 400 })
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
