'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Badge, Button } from '@/components/ui'
import { TaskList, TaskBoard, TaskDrawer, CreateTaskModal } from '@/components/tasks'
import { Task, TaskStatus, TaskStats, StrategyWithTactics, TacticWithKPIs } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

type ViewMode = 'list' | 'board'

/** Mini status dots showing task breakdown */
function MiniStatusDots({ stats }: { stats: TaskStats }) {
  if (stats.total === 0) return null
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      {stats.done > 0 && (
        <span className="flex items-center gap-0.5 text-[10px] text-green-600">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          {stats.done}
        </span>
      )}
      {stats.inProgress > 0 && (
        <span className="flex items-center gap-0.5 text-[10px] text-blue-600">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          {stats.inProgress}
        </span>
      )}
      {stats.blocked > 0 && (
        <span className="flex items-center gap-0.5 text-[10px] text-red-600">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          {stats.blocked}
        </span>
      )}
      {stats.todo > 0 && (
        <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          {stats.todo}
        </span>
      )}
    </div>
  )
}
type QuickFilter = 'all' | 'my_tasks' | 'overdue' | 'high_priority'

export default function AllTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [strategies, setStrategies] = useState<StrategyWithTactics[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [tacticFilter, setTacticFilter] = useState<number | null>(null)
  const [strategyFilter, setStrategyFilter] = useState<number | null>(null)
  const [orgFilter, setOrgFilter] = useState<number | null>(null)
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalTasks, setTotalTasks] = useState(0)

  // UI state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [expandedStrategies, setExpandedStrategies] = useState<number[]>([])
  const [orgs, setOrgs] = useState<Array<{ id: number; name: string; zone: string | null }>>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch strategies and orgs
      const [strategiesRes, orgsRes] = await Promise.all([
        fetch('/api/strategies'),
        fetch('/api/orgs'),
      ])
      if (strategiesRes.ok) {
        const strategiesData = await strategiesRes.json()
        setStrategies(strategiesData)
        // Expand first strategy by default
        if (strategiesData.length > 0 && expandedStrategies.length === 0) {
          setExpandedStrategies([strategiesData[0].id])
        }
      }
      if (orgsRes.ok) {
        const orgsData = await orgsRes.json()
        setOrgs(orgsData)
      }

      // Fetch tasks
      let url = '/api/tasks'
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (searchQuery) params.set('search', searchQuery)
      if (tacticFilter) params.set('tacticId', tacticFilter.toString())
      if (strategyFilter) params.set('strategyId', strategyFilter.toString())
      if (orgFilter) params.set('orgId', orgFilter.toString())
      url += `?${params.toString()}`

      const tasksRes = await fetch(url)
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setTasks(tasksData.tasks || [])
        if (tasksData.pagination) {
          setTotalPages(tasksData.pagination.totalPages)
          setTotalTasks(tasksData.pagination.total)
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, searchQuery, tacticFilter, strategyFilter, orgFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  // Task stats
  const taskStats = useMemo(() => {
    const now = new Date()
    return {
      total: tasks.length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter(t => t.status === 'DONE').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE').length,
      highPriority: tasks.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length,
    }
  }, [tasks])

  const toggleStrategy = (strategyId: number) => {
    setExpandedStrategies(prev => 
      prev.includes(strategyId) 
        ? prev.filter(id => id !== strategyId)
        : [...prev, strategyId]
    )
  }

  const handleStrategyClick = (strategyId: number | null) => {
    setStrategyFilter(strategyId)
    setTacticFilter(null)
    setPage(1)
  }

  const handleTacticClick = (tacticId: number) => {
    setTacticFilter(tacticId)
    setStrategyFilter(null)
    setPage(1)
  }

  // Use real task counts from the strategies API (database-level, not paginated)
  const getTaskCountByStrategy = (strategy: StrategyWithTactics) => {
    return strategy.taskStats?.total ?? strategy._count?.tasks ?? 0
  }

  const getTaskCountByTactic = (tactic: TacticWithKPIs) => {
    return tactic.taskStats?.total ?? tactic._count?.tasks ?? 0
  }

  // Total tasks across all strategies (from DB, not paginated)
  const allTasksTotal = useMemo(() => {
    const fromStrategies = strategies.reduce((sum, s) => sum + (s.taskStats?.total ?? s._count?.tasks ?? 0), 0)
    // Use strategies total if available, fall back to paginated total
    return fromStrategies > 0 ? fromStrategies : totalTasks
  }, [strategies, totalTasks])

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-auto lg:h-[calc(100vh-8rem)] page-enter">
      {/* Strategic Framework Sidebar */}
      <div className={cn(
        'bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden flex flex-col transition-all duration-400 ease-smooth w-full lg:w-72',
        sidebarCollapsed && 'lg:w-12'
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          {!sidebarCollapsed && (
            <h3 className="font-semibold text-gray-800 text-xs tracking-widest uppercase">Strategic Framework</h3>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
            aria-label={sidebarCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
            className="hidden lg:inline-flex p-1.5 hover:bg-gray-200 rounded-lg transition-all duration-200"
          >
            <svg className={cn('w-4 h-4 text-gray-500 transition-transform duration-300', sidebarCollapsed && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Sidebar Content */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto">
            {/* All Tasks */}
            <button
              onClick={() => handleStrategyClick(null)}
              className={cn(
                'w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 border-b border-gray-50 transition-all duration-200',
                !strategyFilter && !tacticFilter && 'bg-primary-50 border-l-4 border-l-primary-500'
              )}
            >
              <span className="font-medium text-gray-700">ทั้งหมด</span>
              <Badge variant="gray">{allTasksTotal}</Badge>
            </button>

            {/* Strategy List */}
            {strategies.map((strategy) => {
              const strategyTotal = getTaskCountByStrategy(strategy)
              const strategyStats = strategy.taskStats
              return (
              <div key={strategy.id} className="border-b last:border-b-0">
                {/* Strategy Header */}
                <div className={cn(
                  'transition-all duration-200',
                  strategyFilter === strategy.id && 'bg-primary-50 border-l-4 border-l-primary-500'
                )}>
                  <div className="flex items-start">
                    <button
                      onClick={() => toggleStrategy(strategy.id)}
                      title="ขยายหรือย่อยุทธศาสตร์"
                      aria-label="ขยายหรือย่อยุทธศาสตร์"
                      className="p-2 mt-1 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
                    >
                      <svg 
                        className={cn(
                          'w-4 h-4 text-gray-400 transition-transform duration-300 ease-spring',
                          expandedStrategies.includes(strategy.id) && 'rotate-90 text-primary-500'
                        )} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleStrategyClick(strategy.id)}
                      className="flex-1 py-2.5 pr-4 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">{strategy.code}</Badge>
                          <span className="text-xs text-gray-400 font-medium">{strategyTotal} งาน</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed" title={strategy.name}>
                        {strategy.name}
                      </p>
                      {/* Mini status indicators */}
                      {strategyStats && strategyTotal > 0 && (
                        <MiniStatusDots stats={strategyStats} />
                      )}
                      {strategy.description && expandedStrategies.includes(strategy.id) && (
                        <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed animate-fade-in-up">
                          {strategy.description}
                        </p>
                      )}
                    </button>
                  </div>
                </div>

                {/* Tactics */}
                {expandedStrategies.includes(strategy.id) && strategy.tactics && (
                  <div className="bg-gray-50/50 animate-fade-in-up border-l-2 border-gray-200 ml-5">
                    {strategy.tactics.map((tactic) => {
                      const tacticTotal = getTaskCountByTactic(tactic)
                      const tacticStats = tactic.taskStats
                      return (
                        <button
                          key={tactic.id}
                          onClick={() => handleTacticClick(tactic.id)}
                          className={cn(
                            'w-full pl-4 pr-3 py-2.5 text-left hover:bg-gray-100/80 transition-all duration-200',
                            tacticFilter === tactic.id && 'bg-primary-50 border-l-4 border-l-primary-400'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{tactic.code}</span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{tacticTotal}</span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed" title={tactic.name}>
                            {tactic.name}
                          </p>
                          {/* Mini status indicators */}
                          {tacticStats && tacticTotal > 0 && (
                            <MiniStatusDots stats={tacticStats} />
                          )}
                          {/* KPI count */}
                          {tactic._count && tactic._count.kpis > 0 && (
                            <span className="text-[10px] text-gray-400 mt-1 inline-block">{tactic._count.kpis} KPIs</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4 animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">งานทั้งหมด</h1>
            <p className="text-gray-500 mt-1">จัดการและติดตามงานทั้งหมดในระบบ</p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} className="btn-shine w-full sm:w-auto">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            สร้างงานใหม่
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-4 stagger-children">
          <div className="bg-white rounded-xl border border-gray-100 p-3 card-hover animate-fade-in-up">
            <p className="text-xs text-gray-500 font-medium">ทั้งหมด</p>
            <p className="text-xl font-bold text-gray-900">{taskStats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 card-hover animate-fade-in-up">
            <p className="text-xs text-gray-500 font-medium">กำลังดำเนินการ</p>
            <p className="text-xl font-bold text-blue-600">{taskStats.inProgress}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 card-hover animate-fade-in-up">
            <p className="text-xs text-gray-500 font-medium">เสร็จสิ้น</p>
            <p className="text-xl font-bold text-green-600">{taskStats.completed}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 card-hover animate-fade-in-up">
            <p className="text-xs text-gray-500 font-medium">เกินกำหนด</p>
            <p className="text-xl font-bold text-red-600">{taskStats.overdue}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 card-hover animate-fade-in-up">
            <p className="text-xs text-gray-500 font-medium">ความสำคัญสูง</p>
            <p className="text-xl font-bold text-orange-600">{taskStats.highPriority}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-white rounded-xl shadow-soft border border-gray-100 p-4 mb-4 animate-fade-in-up">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100/80 rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
                title="รายการ"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200',
                  viewMode === 'board'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
                title="บอร์ด"
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
              onChange={(e) => {
                setStatusFilter(e.target.value as TaskStatus | 'ALL')
                setPage(1)
              }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white hover:border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="TO_DO">รอดำเนินการ</option>
              <option value="IN_PROGRESS">กำลังดำเนินการ</option>
              <option value="BLOCKED">ติดขัด</option>
              <option value="DONE">เสร็จสิ้น</option>
            </select>

            {/* Org Filter */}
            <select
              value={orgFilter?.toString() || ''}
              title="กรองตามหน่วยงาน"
              aria-label="กรองตามหน่วยงาน"
              onChange={(e) => {
                setOrgFilter(e.target.value ? parseInt(e.target.value) : null)
                setPage(1)
              }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white hover:border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            >
              <option value="">ทุกสำนัก/หน่วยงาน</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id.toString()}>
                  🏢 {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative group w-full lg:w-auto">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors duration-200 group-focus-within:text-primary-500"
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
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="pl-10 pr-4 py-1.5 text-sm border border-gray-200 rounded-xl w-full lg:w-64 transition-all duration-300 lg:focus:w-80 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 hover:border-gray-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                title="ล้างคำค้นหา"
                aria-label="ล้างคำค้นหา"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {(strategyFilter || tacticFilter || statusFilter !== 'ALL' || searchQuery || orgFilter) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-sm text-gray-500">ตัวกรอง:</span>
            {orgFilter && (
              <Badge variant="default" className="flex items-center gap-1 bg-purple-100 text-purple-700">
                🏢 {orgs.find(o => o.id === orgFilter)?.name}
                <button onClick={() => setOrgFilter(null)} title="ลบตัวกรองหน่วยงาน" aria-label="ลบตัวกรองหน่วยงาน" className="ml-1">×</button>
              </Badge>
            )}
            {strategyFilter && (
              <Badge variant="info" className="flex items-center gap-1">
                ยุทธศาสตร์: {strategies.find(s => s.id === strategyFilter)?.code}
                <button onClick={() => setStrategyFilter(null)} title="ลบตัวกรองยุทธศาสตร์" aria-label="ลบตัวกรองยุทธศาสตร์" className="ml-1">×</button>
              </Badge>
            )}
            {tacticFilter && (
              <Badge variant="info" className="flex items-center gap-1">
                กลยุทธ์: {strategies.flatMap(s => s.tactics).find(t => t.id === tacticFilter)?.code}
                <button onClick={() => setTacticFilter(null)} title="ลบตัวกรองกลยุทธ์" aria-label="ลบตัวกรองกลยุทธ์" className="ml-1">×</button>
              </Badge>
            )}
            {statusFilter !== 'ALL' && (
              <Badge variant="gray" className="flex items-center gap-1">
                สถานะ: {statusFilter === 'TO_DO' ? 'รอดำเนินการ' : statusFilter === 'IN_PROGRESS' ? 'กำลังดำเนินการ' : statusFilter === 'BLOCKED' ? 'ติดขัด' : 'เสร็จสิ้น'}
                <button onClick={() => setStatusFilter('ALL')} title="ลบตัวกรองสถานะ" aria-label="ลบตัวกรองสถานะ" className="ml-1">×</button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="gray" className="flex items-center gap-1">
                ค้นหา: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} title="ลบคำค้นหา" aria-label="ลบคำค้นหา" className="ml-1">×</button>
              </Badge>
            )}
            <button 
              onClick={() => {
                setStrategyFilter(null)
                setTacticFilter(null)
                setStatusFilter('ALL')
                setSearchQuery('')
                setOrgFilter(null)
              }}
              className="text-sm text-primary-600 hover:underline"
            >
              ล้างทั้งหมด
            </button>
          </div>
        )}

        {/* Task View */}
        <div className="flex-1 bg-white rounded-2xl shadow-soft border border-gray-100 p-3 sm:p-6 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ก่อนหน้า
            </Button>
            <span className="text-sm text-gray-500">
              หน้า {page} จาก {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              ถัดไป
            </Button>
          </div>
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
        onSuccess={fetchData}
      />
    </div>
  )
}
