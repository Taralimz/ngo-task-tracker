'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge, Button } from '@/components/ui'
import { TaskList, TaskBoard, TaskDrawer, CreateTaskModal } from '@/components/tasks'
import { Task, TaskStatus, StrategyWithTactics, TacticWithKPIs } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

type ViewMode = 'list' | 'board'

export default function TacticTasksPage() {
  const params = useParams()
  const router = useRouter()
  const tacticId = Number(params.tacticId)

  const [tactic, setTactic] = useState<TacticWithKPIs | null>(null)
  const [strategyCode, setStrategyCode] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [strategies, setStrategies] = useState<StrategyWithTactics[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // UI state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch strategies (for sidebar and create modal)
      const strategiesRes = await fetch('/api/strategies')
      if (strategiesRes.ok) {
        const strategiesData = await strategiesRes.json()
        setStrategies(strategiesData)
        
        // Find current tactic and strategy
        for (const strategy of strategiesData) {
          const foundTactic = strategy.tactics.find((t: TacticWithKPIs) => t.id === tacticId)
          if (foundTactic) {
            setTactic(foundTactic)
            setStrategyCode(strategy.code)
            break
          }
        }
      }

      // Fetch tasks for this tactic
      let url = `/api/tactics/${tacticId}/tasks`
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)
      if (params.toString()) url += `?${params.toString()}`

      const tasksRes = await fetch(url)
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setTasks(tasksData.tasks || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }, [tacticId, statusFilter, searchQuery])

  useEffect(() => {
    if (tacticId) {
      fetchData()
    }
  }, [tacticId, fetchData])

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setDrawerOpen(true)
  }

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success('อัปเดตสถานะสำเร็จ')
        fetchData()
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      toast.error('ไม่สามารถอัปเดตสถานะได้')
    }
  }

  if (!tactic && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500 mb-4">ไม่พบแผนกลยุทธ์</p>
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          กลับไปหน้าหลัก
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default">{strategyCode}</Badge>
            <span className="text-gray-400">›</span>
            <Badge variant="info">{tactic?.code}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{tactic?.name}</h1>
          <p className="text-gray-500 mt-1">
            {tactic?.kpis.length || 0} KPIs • {tasks.length} งาน
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          สร้างงานใหม่
        </Button>
      </div>

      {/* KPI Overview */}
      {tactic && tactic.kpis.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">KPIs ภายใต้แผนกลยุทธ์นี้</h3>
          <div className="flex flex-wrap gap-2">
            {tactic.kpis.map((kpi) => (
              <div
                key={kpi.id}
                className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-sm"
              >
                <span className="font-medium text-green-800">{kpi.code}</span>
                <span className="text-green-600 ml-1">{kpi.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              title="รายการ"
              aria-label="รายการ"
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('board')}
              title="บอร์ด"
              aria-label="บอร์ด"
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                viewMode === 'board'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            title="กรองตามสถานะ"
            aria-label="กรองตามสถานะ"
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'ALL')}
            className="text-sm border rounded-lg px-3 py-1.5"
          >
            <option value="ALL">ทุกสถานะ</option>
            <option value="TO_DO">รอดำเนินการ</option>
            <option value="IN_PROGRESS">กำลังดำเนินการ</option>
            <option value="BLOCKED">ติดขัด</option>
            <option value="DONE">เสร็จสิ้น</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="ค้นหางาน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-1.5 text-sm border rounded-lg w-64"
          />
        </div>
      </div>

      {/* Task View */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : viewMode === 'list' ? (
          <TaskList
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <TaskBoard
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onStatusChange={handleStatusChange}
          />
        )}
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
        initialTacticId={tacticId}
        onSuccess={fetchData}
      />
    </div>
  )
}
