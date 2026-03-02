// Available permissions
export const PERMISSIONS: Record<string, string> = {
  // Task permissions
  'task.view': 'ดูงานทั้งหมด',
  'task.view_own': 'ดูเฉพาะงานที่ได้รับมอบหมาย',
  'task.create': 'สร้างงานใหม่',
  'task.edit': 'แก้ไขงาน',
  'task.delete': 'ลบงาน',
  'task.assign': 'มอบหมายงาน',
  
  // KPI permissions  
  'kpi.view': 'ดู KPI ทั้งหมด',
  'kpi.create': 'สร้าง KPI',
  'kpi.edit': 'แก้ไข KPI',
  'kpi.delete': 'ลบ KPI',
  'kpi.value_entry': 'บันทึกค่า KPI',
  
  // Strategy permissions
  'strategy.view': 'ดูยุทธศาสตร์',
  'strategy.manage': 'จัดการยุทธศาสตร์/กลยุทธ์',
  
  // User permissions
  'user.view': 'ดูรายชื่อผู้ใช้',
  'user.manage': 'จัดการผู้ใช้',
  
  // Team permissions
  'team.view': 'ดูทีม',
  'team.manage': 'จัดการทีม',
  
  // Report permissions
  'report.view': 'ดูรายงาน',
  'report.export': 'ส่งออกรายงาน',
  
  // System permissions
  'system.settings': 'ตั้งค่าระบบ',
  'system.audit_log': 'ดู Audit Log',
}
