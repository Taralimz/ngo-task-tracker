import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/teams/[id]/members - Get team members
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

    const members = await prisma.teamMember.findMany({
      where: { teamId: parseInt(id) },
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
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Get team members error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

// POST /api/teams/[id]/members - Add member to team
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['superadmin', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เพิ่มสมาชิกทีม' }, { status: 403 })
    }

    const { id } = await context.params
    const teamId = parseInt(id)
    const body = await request.json()
    const { userId, role = 'member' } = body

    if (!userId) {
      return NextResponse.json({ error: 'กรุณาระบุผู้ใช้' }, { status: 400 })
    }

    // Check if team exists
    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) {
      return NextResponse.json({ error: 'ไม่พบทีม' }, { status: 404 })
    }

    // Check if user exists
    const userToAdd = await prisma.user.findUnique({ where: { id: userId } })
    if (!userToAdd) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้' }, { status: 404 })
    }

    // Check if already a member
    const existing = await prisma.teamMember.findFirst({
      where: { teamId, userId }
    })
    if (existing) {
      return NextResponse.json({ error: 'ผู้ใช้เป็นสมาชิกทีมนี้อยู่แล้ว' }, { status: 400 })
    }

    const member = await prisma.teamMember.create({
      data: { teamId, userId, role },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true }
        }
      }
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Add team member error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเพิ่มสมาชิก' }, { status: 500 })
  }
}

// PATCH /api/teams/[id]/members - Update member role or bulk add/remove
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
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขสมาชิกทีม' }, { status: 403 })
    }

    const { id } = await context.params
    const teamId = parseInt(id)
    const body = await request.json()
    const { userId, role, memberIds } = body

    // Bulk update members
    if (memberIds !== undefined) {
      // Remove all existing members and add new ones
      await prisma.teamMember.deleteMany({ where: { teamId } })
      
      if (memberIds.length > 0) {
        await prisma.teamMember.createMany({
          data: memberIds.map((uid: number, index: number) => ({
            teamId,
            userId: uid,
            role: index === 0 ? 'leader' : 'member'
          }))
        })
      }

      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            include: {
              user: { select: { id: true, fullName: true, email: true } }
            }
          },
          _count: { select: { members: true } }
        }
      })

      return NextResponse.json(team)
    }

    // Update single member role
    if (userId && role) {
      const member = await prisma.teamMember.updateMany({
        where: { teamId, userId },
        data: { role }
      })

      if (member.count === 0) {
        return NextResponse.json({ error: 'ไม่พบสมาชิกในทีม' }, { status: 404 })
      }

      return NextResponse.json({ message: 'อัปเดตสำเร็จ' })
    }

    return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 })
  } catch (error) {
    console.error('Update team members error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปเดตสมาชิก' }, { status: 500 })
  }
}

// DELETE /api/teams/[id]/members - Remove member from team
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
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ลบสมาชิกทีม' }, { status: 403 })
    }

    const { id } = await context.params
    const teamId = parseInt(id)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'กรุณาระบุผู้ใช้' }, { status: 400 })
    }

    const result = await prisma.teamMember.deleteMany({
      where: { teamId, userId: parseInt(userId) }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'ไม่พบสมาชิกในทีม' }, { status: 404 })
    }

    return NextResponse.json({ message: 'ลบสมาชิกสำเร็จ' })
  } catch (error) {
    console.error('Remove team member error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบสมาชิก' }, { status: 500 })
  }
}
