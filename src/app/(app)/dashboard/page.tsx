'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button } from '@/components/ui'
import { Task, StrategyWithTactics } from '@/types'
import { TaskCard, TaskDrawer, CreateTaskModal } from '@/components/tasks'
import { cn } from '@/lib/utils'

interface DashboardStats {
  totalTasks: number
  todoTasks: number
  inProgressTasks: number
  blockedTasks: number
  completedTasks: number
  overdueTasks: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [strategies, setStrategies] = useState<StrategyWithTactics[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tasksRes, strategiesRes] = await Promise.all([
        fetch('/api/tasks?limit=10'),
        fetch('/api/strategies'),
      ])

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        const tasks = tasksData.tasks || []
        setRecentTasks(tasks)
        
        // Calculate stats from tasks
        const allTasks = tasks as Task[]
        const now = new Date()
        setStats({
          totalTasks: tasksData.pagination?.total || allTasks.length,
          todoTasks: allTasks.filter((t) => t.status === 'TO_DO').length,
          inProgressTasks: allTasks.filter((t) => t.status === 'IN_PROGRESS').length,
          blockedTasks: allTasks.filter((t) => t.status === 'BLOCKED').length,
          completedTasks: allTasks.filter((t) => t.status === 'DONE').length,
          overdueTasks: allTasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE').length,
        })
      }

      if (strategiesRes.ok) {
        const strategiesData = await strategiesRes.json()
        setStrategies(strategiesData)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setDrawerOpen(true)
  }

  const statCards = [
    { label: 'งานทั้งหมด', value: stats?.totalTasks || 0, color: 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 border border-gray-200/60', icon: '📋' },
    { label: 'รอดำเนินการ', value: stats?.todoTasks || 0, color: 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 border border-slate-200/60', icon: '⏳' },
    { label: 'กำลังดำเนินการ', value: stats?.inProgressTasks || 0, color: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800 border border-blue-200/60', icon: '🚀' },
    { label: 'ติดขัด', value: stats?.blockedTasks || 0, color: 'bg-gradient-to-br from-red-50 to-red-100 text-red-800 border border-red-200/60', icon: '⚠️' },
    { label: 'เสร็จสิ้น', value: stats?.completedTasks || 0, color: 'bg-gradient-to-br from-green-50 to-green-100 text-green-800 border border-green-200/60', icon: '✅' },
    { label: 'เกินกำหนด', value: stats?.overdueTasks || 0, color: 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-800 border border-orange-200/60', icon: '🔥' },
  ]

  if (loading) {
    return (
      <div className="space-y-6 page-enter">
        {/* Skeleton Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-8 w-40 mb-2" />
            <div className="skeleton h-4 w-64" />
          </div>
          <div className="skeleton h-10 w-32 rounded-xl" />
        </div>
        {/* Skeleton Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
        {/* Skeleton Cards */}
        <div className="bg-white rounded-2xl p-6 shadow-soft">
          <div className="skeleton h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">แดชบอร์ด</h1>
          <p className="text-gray-500 mt-1">ภาพรวมของงานและความคืบหน้า</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="btn-shine">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          สร้างงานใหม่
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
        {statCards.map((stat, index) => (
          <div
            key={stat.label}
            className={cn('p-4 rounded-2xl card-hover animate-fade-in-up', stat.color)}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold tracking-tight animate-count-up" style={{ animationDelay: `${index * 80 + 200}ms` }}>{stat.value}</div>
            <div className="text-sm opacity-70 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">งานล่าสุด</h2>
          <button
            onClick={() => router.push('/tasks')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:bg-primary-50 px-3 py-1 rounded-lg transition-all duration-200"
          >
            ดูทั้งหมด →
          </button>
        </div>

        {!recentTasks || recentTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p>ยังไม่มีงาน</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="mt-4"
            >
              สร้างงานแรก
            </Button>
          </div>
        ) : (
          <div className="space-y-2 stagger-children">
            {recentTasks.map((task) => (
              <div key={task.id} className="animate-fade-in-up">
                <TaskCard
                  task={task}
                  view="list"
                  onClick={() => handleTaskClick(task)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Strategic Overview */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ภาพรวมยุทธศาสตร์</h2>
        <div className="space-y-4">
          {strategies.map((strategy) => (
            <div key={strategy.id} className="border border-gray-100 rounded-xl p-4 card-hover">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">{strategy.code}</Badge>
                <span className="font-medium text-gray-900">{strategy.name}</span>
              </div>
              <div className="ml-4 space-y-2">
                {strategy.tactics.map((tactic) => (
                  <button
                    key={tactic.id}
                    onClick={() => router.push(`/tactics/${tactic.id}/tasks`)}
                    className="w-full text-left p-3 bg-gray-50/80 rounded-xl hover:bg-gray-100 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="info" size="sm">{tactic.code}</Badge>
                        <span className="ml-2 text-sm text-gray-700">{tactic.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {tactic.kpis.length} KPIs
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Drawer */}
      <TaskDrawer
        task={selectedTask}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdate={fetchData}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        strategies={strategies}
        onSuccess={fetchData}
      />
    </div>
  )
}
