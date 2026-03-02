import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/teams/[id] - Get single team
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

    const team = await prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, role: true, org: { select: { name: true } } }
            }
          },
          orderBy: [
            { role: 'asc' },
            { createdAt: 'asc' }
          ]
        },
        taskAssignments: {
          include: {
            task: {
              select: { id: true, title: true, status: true, priority: true, dueDate: true }
            }
          },
          take: 10
        },
        _count: {
          select: { members: true, taskAssignments: true }
        }
      }
    })

    if (!team) {
      return NextResponse.json({ error: 'ไม่พบทีม' }, { status: 404 })
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error('Get team error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

// PATCH /api/teams/[id] - Update team
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขทีม' }, { status: 403 })
    }

    const { id } = await context.params
    const teamId = parseInt(id)
    const body = await request.json()
    const { name, description, color, isDefault, active } = body

    // Check if team exists
    const existing = await prisma.team.findUnique({ where: { id: teamId } })
    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบทีม' }, { status: 404 })
    }

    // Check duplicate name
    if (name && name !== existing.name) {
      const duplicate = await prisma.team.findFirst({
        where: { name: name.trim(), id: { not: teamId } }
      })
      if (duplicate) {
        return NextResponse.json({ error: 'ชื่อทีมนี้มีอยู่แล้ว' }, { status: 400 })
      }
    }

    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
        ...(isDefault !== undefined && { isDefault }),
        ...(active !== undefined && { active })
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true } }
          }
        },
        _count: {
          select: { members: true, taskAssignments: true }
        }
      }
    })

    return NextResponse.json(team)
  } catch (error) {
    console.error('Update team error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปเดตทีม' }, { status: 500 })
  }
}

// DELETE /api/teams/[id] - Delete team
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ลบทีม' }, { status: 403 })
    }

    const { id } = await context.params
    const teamId = parseInt(id)

    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) {
      return NextResponse.json({ error: 'ไม่พบทีม' }, { status: 404 })
    }

    if (team.isDefault) {
      return NextResponse.json({ error: 'ไม่สามารถลบทีมเริ่มต้นได้' }, { status: 400 })
    }

    await prisma.team.delete({ where: { id: teamId } })

    return NextResponse.json({ message: 'ลบทีมสำเร็จ' })
  } catch (error) {
    console.error('Delete team error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบทีม' }, { status: 500 })
  }
}
