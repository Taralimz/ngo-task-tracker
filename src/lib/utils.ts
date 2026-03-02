import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isOverdue(dueDate: Date | string | null | undefined): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

export function daysUntilDue(dueDate: Date | string | null | undefined): number | null {
  if (!dueDate) return null
  const now = new Date()
  const due = new Date(dueDate)
  const diff = due.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export const statusLabels: Record<string, string> = {
  TO_DO: 'รอดำเนินการ',
  IN_PROGRESS: 'กำลังดำเนินการ',
  BLOCKED: 'ติดขัด',
  DONE: 'เสร็จสิ้น',
}

export const statusColors: Record<string, string> = {
  TO_DO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  BLOCKED: 'bg-red-100 text-red-700',
  DONE: 'bg-green-100 text-green-700',
}

export const priorityLabels: Record<string, string> = {
  LOW: 'ต่ำ',
  NORMAL: 'ปกติ',
  HIGH: 'สูง',
  URGENT: 'เร่งด่วน',
}

export const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  NORMAL: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
}

export const contributionTypeLabels: Record<string, string> = {
  DIRECT: 'ส่งผลโดยตรง',
  SUPPORT: 'สนับสนุน',
}

export const roleLabels: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  admin_zone: 'Admin Zone',
  user_org: 'User',
}

// Helper functions
export function getStatusColor(status: string): string {
  return statusColors[status] || statusColors.TO_DO
}

export function getStatusLabel(status: string): string {
  return statusLabels[status] || status
}

export function getPriorityColor(priority: string): string {
  return priorityColors[priority] || priorityColors.NORMAL
}

export function getPriorityLabel(priority: string): string {
  return priorityLabels[priority] || priority
}

export function formatThaiDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
