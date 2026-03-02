import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'

// Group permissions by category
const PERMISSION_CATEGORIES = {
  'งาน (Tasks)': [
    'task.view',
    'task.view_own',
    'task.create',
    'task.edit',
    'task.delete',
    'task.assign',
  ],
  'KPI': [
    'kpi.view',
    'kpi.create',
    'kpi.edit',
    'kpi.delete',
    'kpi.value_entry',
  ],
  'ยุทธศาสตร์': [
    'strategy.view',
    'strategy.manage',
  ],
  'ผู้ใช้': [
    'user.view',
    'user.manage',
  ],
  'ทีม': [
    'team.view',
    'team.manage',
  ],
  'รายงาน': [
    'report.view',
    'report.export',
  ],
  'ระบบ': [
    'system.settings',
    'system.audit_log',
  ],
}

// GET /api/permission-groups/permissions - Get available permissions list
export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      permissions: PERMISSIONS,
      categories: PERMISSION_CATEGORIES
    })
  } catch (error) {
    console.error('Get permissions error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
