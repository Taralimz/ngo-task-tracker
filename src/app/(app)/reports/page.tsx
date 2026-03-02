'use client'

import { useEffect, useState } from 'react'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ReportData {
  totalTasks: number
  tasksByStatus: Record<string, number>
  tasksByPriority: Record<string, number>
  overdueTasks: number
  strategySummary: Array<{
    id: number
    code: string
    name: string
    totalTasks: number
    totalTactics: number
    totalKPIs: number
  }>
  kpiAchievement: Array<{
    id: number
    code: string
    name: string
    unit: string
    strategyCode: string
    tacticCode: string
    currentValue: number
    targetValue: number
    achievementRate: number
    frequency: string
  }>
  recentActivity: Array<{
    id: number
    status: string
    progressPercent: number
    createdAt: string
    task: { id: number; title: string }
    user: { id: number; fullName: string }
  }>
}

const statusLabels: Record<string, string> = {
  TO_DO: 'รอดำเนินการ',
  IN_PROGRESS: 'กำลังดำเนินการ',
  BLOCKED: 'ติดขัด',
  DONE: 'เสร็จสิ้น',
}

const statusColors: Record<string, string> = {
  TO_DO: 'bg-slate-100 text-slate-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  BLOCKED: 'bg-red-100 text-red-800',
  DONE: 'bg-green-100 text-green-800',
}

const priorityLabels: Record<string, string> = {
  LOW: 'ต่ำ',
  NORMAL: 'ปกติ',
  HIGH: 'สูง',
  URGENT: 'เร่งด่วน',
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear().toString())

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?year=${year}`)
      if (res.ok) {
        const reportData = await res.json()
        setData(reportData)
      }
    } catch (error) {
      console.error('Failed to fetch report:', error)
      toast.error('ไม่สามารถโหลดรายงานได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [year])

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'bg-green-500'
    if (percent >= 50) return 'bg-yellow-500'
    if (percent >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        ไม่สามารถโหลดข้อมูลรายงานได้
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">รายงานสรุป</h1>
          <p className="text-gray-500 mt-1">ภาพรวมความคืบหน้าของแผนงานและ KPI</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                ปี {y + 543}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => window.print()}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            พิมพ์รายงาน
          </Button>
        </div>
      </div>

      {/* Task Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">งานทั้งหมด</p>
          <p className="text-2xl font-bold">{data.totalTasks}</p>
        </div>
        {Object.entries(data.tasksByStatus).map(([status, count]) => (
          <div key={status} className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">{statusLabels[status] || status}</p>
            <p className="text-2xl font-bold">{count}</p>
          </div>
        ))}
        <div className="bg-white p-4 rounded-lg border border-red-200 bg-red-50">
          <p className="text-sm text-red-600">เกินกำหนด</p>
          <p className="text-2xl font-bold text-red-600">{data.overdueTasks}</p>
        </div>
      </div>

      {/* Strategy Summary */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">สรุปตามยุทธศาสตร์</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ยุทธศาสตร์</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">กลยุทธ์</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">KPI</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">งานทั้งหมด</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.strategySummary.map((strategy) => (
                <tr key={strategy.id}>
                  <td className="px-4 py-3">
                    <span className="font-medium">{strategy.code}</span>
                    <p className="text-sm text-gray-500">{strategy.name}</p>
                  </td>
                  <td className="px-4 py-3 text-center">{strategy.totalTactics}</td>
                  <td className="px-4 py-3 text-center">{strategy.totalKPIs}</td>
                  <td className="px-4 py-3 text-center">{strategy.totalTasks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI Achievement */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">ผลการดำเนินงาน KPI</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">KPI</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ยุทธศาสตร์</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">ผลงาน</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">เป้าหมาย</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600 w-48">ความคืบหน้า</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.kpiAchievement.map((kpi) => (
                <tr key={kpi.id}>
                  <td className="px-4 py-3">
                    <span className="font-medium">{kpi.code}</span>
                    <p className="text-sm text-gray-500 line-clamp-1">{kpi.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="gray">{kpi.strategyCode}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {kpi.currentValue.toLocaleString()} {kpi.unit}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {kpi.targetValue.toLocaleString()} {kpi.unit}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full', getProgressColor(kpi.achievementRate))}
                          style={{ width: `${kpi.achievementRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {kpi.achievementRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">กิจกรรมล่าสุด</h2>
        </div>
        <div className="divide-y">
          {data.recentActivity.map((activity) => (
            <div key={activity.id} className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{activity.task.title}</p>
                <p className="text-sm text-gray-500">
                  อัปเดตโดย {activity.user.fullName}
                </p>
              </div>
              <Badge className={statusColors[activity.status]}>
                {statusLabels[activity.status]}
              </Badge>
              <span className="text-sm text-gray-500">
                {activity.progressPercent}%
              </span>
              <span className="text-sm text-gray-400">
                {new Date(activity.createdAt).toLocaleDateString('th-TH')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
