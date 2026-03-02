import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '7d'

export interface JWTPayload {
  userId: number
  email: string
  role: UserRole
  orgId: number | null
}

export interface AuthUser {
  id: number
  email: string
  fullName: string
  role: UserRole
  orgId: number | null
  org?: {
    id: number
    name: string
    zone: string | null
    province: string | null
  } | null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      org: {
        select: { id: true, name: true, zone: true, province: true },
      },
    },
  })

  if (!user || !user.active) return null

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    orgId: user.orgId,
    org: user.org,
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

// RBAC Helpers
export function canAccessAllOrgs(role: UserRole): boolean {
  return role === 'superadmin' || role === 'admin'
}

export function canAccessZone(role: UserRole): boolean {
  return role === 'superadmin' || role === 'admin' || role === 'admin_zone'
}

export function canManageStrategies(role: UserRole): boolean {
  return role === 'superadmin' || role === 'admin'
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'superadmin' || role === 'admin'
}

// Check if user can access a task based on org scope
export async function canAccessTask(user: AuthUser, taskId: number): Promise<boolean> {
  if (canAccessAllOrgs(user.role)) return true

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignees: { include: { user: true } },
    },
  })

  if (!task) return false

  // admin_zone can access tasks assigned to their zone orgs or tasks belonging to their zone
  if (user.role === 'admin_zone' && user.org?.zone) {
    // Task belongs to the user's org
    if (task.orgId === user.orgId) return true
    // Task is assigned to someone in the same org
    const hasOrgAssignee = task.assignees.some((a) => a.user.orgId === user.orgId)
    if (hasOrgAssignee) return true
    // Task created by this user
    if (task.createdById === user.id) return true
    // Check if task belongs to an org in the same zone
    if (task.orgId) {
      const taskOrg = await prisma.org.findUnique({ where: { id: task.orgId }, select: { zone: true } })
      if (taskOrg?.zone === user.org.zone) return true
    }
    return false
  }

  // user_org can only access tasks they're assigned to, created, or belonging to their org
  if (user.role === 'user_org') {
    if (task.orgId === user.orgId) return true
    const isAssigned = task.assignees.some((a) => a.userId === user.id)
    return isAssigned || task.createdById === user.id
  }

  return false
}

// Validate that tactic belongs to strategy
export async function validateTacticBelongsToStrategy(tacticId: number, strategyId: number): Promise<boolean> {
  const tactic = await prisma.tactic.findUnique({
    where: { id: tacticId },
    select: { strategyId: true },
  })
  return tactic?.strategyId === strategyId
}

// Validate KPIs belong to tactic
export async function validateKPIsBelongToTactic(kpiIds: number[], tacticId: number): Promise<boolean> {
  const kpis = await prisma.kPI.findMany({
    where: { id: { in: kpiIds } },
    select: { tacticId: true },
  })
  return kpis.length === kpiIds.length && kpis.every((k) => k.tacticId === tacticId)
}
