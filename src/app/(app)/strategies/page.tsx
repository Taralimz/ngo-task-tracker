'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface TaskStats {
  total: number
  todo: number
  inProgress: number
  done: number
  blocked: number
  overdue: number
  avgProgress: number
}

interface KPI {
  id: number
  code: string
  name: string
  unit: string
  frequency: string
  active: boolean
  _count: { values: number; taskKpis: number }
}

interface Tactic {
  id: number
  code: string
  name: string
  description: string | null
  active: boolean
  sortOrder: number
  _count: { kpis: number; tasks: number }
  kpis: KPI[]
  taskStats: TaskStats
}

interface Strategy {
  id: number
  code: string
  name: string
  description: string | null
  active: boolean
  sortOrder: number
  _count: { tactics: number; tasks: number }
  tactics: Tactic[]
  taskStats: TaskStats
}

interface ModalProps {
  type: 'strategy' | 'tactic' | 'kpi'
  item: any
  parentId: number | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

function EditModal({ type, item, parentId, isOpen, onClose, onSave }: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    unit: '',
    frequency: 'monthly',
    active: true,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {    if (item) {
      setFormData({
        code: item.code || '',
        name: item.name || '',
        description: item.description || '',
        unit: item.unit || '',
        frequency: item.frequency || 'monthly',
        active: item.active !== false,
      })
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        unit: '',
        frequency: 'monthly',
        active: true,
      })
    }
  }, [item, isOpen])

  if (!isOpen || !mounted) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let url = ''
      let body: any = {}

      if (type === 'strategy') {
        url = item ? `/api/strategies/${item.id}` : '/api/strategies'
        body = {
          code: formData.code,
          name: formData.name,
          description: formData.description || null,
          active: formData.active,
        }
      } else if (type === 'tactic') {
        url = item ? `/api/tactics/${item.id}` : '/api/tactics'
        body = {
          strategyId: parentId,
          code: formData.code,
          name: formData.name,
          description: formData.description || null,
          active: formData.active,
        }
      } else if (type === 'kpi') {
        url = item ? `/api/kpis/${item.id}` : '/api/kpis'
        body = {
          tacticId: parentId,
          code: formData.code,
          name: formData.name,
          unit: formData.unit,
          frequency: formData.frequency,
          definition: formData.description || null,
          active: formData.active,
        }
      }

      const res = await fetch(url, {
        method: item ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(item ? 'อัปเดตสำเร็จ' : 'เพิ่มสำเร็จ')
        onSave()
        onClose()
      } else {
        const data = await res.json()
        toast.error(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const typeLabels = {
    strategy: 'ยุทธศาสตร์',
    tactic: 'กลยุทธ์',
    kpi: 'KPI',
  }

  const typeIcons = {
    strategy: '🏛️',
    tactic: '🎯',
    kpi: '📊',
  }

  const typeColors = {
    strategy: 'from-indigo-500 to-purple-500',
    tactic: 'from-blue-500 to-cyan-500',
    kpi: 'from-emerald-500 to-teal-500',
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-overlay" onClick={onClose}>
      <div
        className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-elevated w-full max-w-md mx-4 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <span className={cn('w-9 h-9 rounded-xl bg-gradient-to-br text-white flex items-center justify-center text-lg shadow-sm', typeColors[type])}>
            {typeIcons[type]}
          </span>
          <h3 className="text-lg font-semibold text-gray-900">
            {item ? 'แก้ไข' : 'เพิ่ม'}{typeLabels[type]}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัส *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-gray-400 transition-all duration-200 ease-smooth"
              placeholder={`เช่น ${type === 'strategy' ? 'STR-07' : type === 'tactic' ? 'TAC-7.1' : 'KPI-7.1.1'}`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-gray-400 transition-all duration-200 ease-smooth"
              placeholder="ระบุชื่อ"
              required
            />
          </div>
          {type === 'kpi' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">หน่วยวัด *</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-gray-400 transition-all duration-200 ease-smooth"
                  placeholder="เช่น คน, ครั้ง, บาท"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ความถี่การวัด</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-gray-400 transition-all duration-200 ease-smooth appearance-none cursor-pointer bg-white"
                  title="ความถี่การวัด"
                >
                  <option value="monthly">📆 รายเดือน</option>
                  <option value="quarterly">📅 รายไตรมาส</option>
                  <option value="yearly">🗓️ รายปี</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {type === 'kpi' ? 'คำจำกัดความ' : 'รายละเอียด'}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-gray-400 transition-all duration-200 ease-smooth resize-none"
              rows={3}
              placeholder={type === 'kpi' ? 'คำจำกัดความของ KPI' : 'รายละเอียดเพิ่มเติม'}
            />
          </div>
          {item && (
            <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded-md border-gray-300 text-primary-600 shadow-sm focus:ring-primary-500/20 w-4 h-4"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">เปิดใช้งาน</label>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading} className="btn-shine">
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

// ---- Progress Ring SVG Component ----
function ProgressRing({ progress, size = 48, stroke = 5, color = 'primary' }: { progress: number; size?: number; stroke?: number; color?: string }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference
  const colorMap: Record<string, string> = {
    primary: 'text-primary-500',
    green: 'text-green-500',
    yellow: 'text-amber-500',
    red: 'text-red-500',
  }
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={stroke} fill="none" className="text-gray-100" />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke="currentColor" strokeWidth={stroke} fill="none"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        className={cn('transition-all duration-700 ease-smooth', colorMap[color] || colorMap.primary)}
      />
    </svg>
  )
}

// ---- Status Health Badge ----
function HealthBadge({ stats }: { stats: TaskStats }) {
  if (stats.total === 0) return <Badge variant="gray">ยังไม่มีงาน</Badge>
  if (stats.overdue > 0) return <Badge variant="danger">⚠ {stats.overdue} เกินกำหนด</Badge>
  if (stats.blocked > 0) return <Badge variant="warning">🔒 ติดบล็อก</Badge>
  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
  if (pct >= 100) return <Badge variant="success">✓ เสร็จสมบูรณ์</Badge>
  if (pct >= 50) return <Badge variant="info">กำลังดำเนินการ</Badge>
  return <Badge variant="gray">เริ่มต้น</Badge>
}

// ---- Mini bar showing task status breakdown ----
function StatusBar({ stats }: { stats: TaskStats }) {
  if (stats.total === 0) return <div className="h-2 rounded-full bg-gray-100 w-full" />
  const segments = [
    { pct: (stats.done / stats.total) * 100, color: 'bg-green-400' },
    { pct: (stats.inProgress / stats.total) * 100, color: 'bg-blue-400' },
    { pct: (stats.blocked / stats.total) * 100, color: 'bg-red-400' },
    { pct: (stats.todo / stats.total) * 100, color: 'bg-gray-200' },
  ]
  return (
    <div className="h-2 rounded-full overflow-hidden flex w-full bg-gray-100">
      {segments.map((seg, i) => seg.pct > 0 && (
        <div key={i} className={cn('h-full transition-all duration-500', seg.color)} role="presentation" aria-hidden="true" ref={(el) => { if (el) el.style.width = `${seg.pct}%` }} />
      ))}
    </div>
  )
}

export default function StrategiesPage() {
  const router = useRouter()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedStrategies, setExpandedStrategies] = useState<number[]>([])
  const [expandedTactics, setExpandedTactics] = useState<number[]>([])
  const [modalType, setModalType] = useState<'strategy' | 'tactic' | 'kpi'>('strategy')
  const [modalItem, setModalItem] = useState<any>(null)
  const [modalParentId, setModalParentId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchStrategies = async () => {
    try {
      const res = await fetch('/api/strategies')
      if (res.ok) {
        const data = await res.json()
        setStrategies(data)
      }
    } catch (error) {
      console.error('Failed to fetch strategies:', error)
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStrategies()
  }, [])

  const toggleStrategy = (id: number) => {
    setExpandedStrategies((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const toggleTactic = (id: number) => {
    setExpandedTactics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const openModal = (type: 'strategy' | 'tactic' | 'kpi', item: any = null, parentId: number | null = null) => {
    setModalType(type)
    setModalItem(item)
    setModalParentId(parentId)
    setModalOpen(true)
  }

  // Summary stats
  const totalStrategies = strategies.length
  const totalTactics = strategies.reduce((s, st) => s + st.tactics.length, 0)
  const totalKPIs = strategies.reduce((s, st) => s + st.tactics.reduce((s2, t) => s2 + t.kpis.length, 0), 0)
  const totalTasks = strategies.reduce((s, st) => s + st.taskStats.total, 0)
  const totalDone = strategies.reduce((s, st) => s + st.taskStats.done, 0)
  const totalOverdue = strategies.reduce((s, st) => s + st.taskStats.overdue, 0)
  const overallProgress = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

  const getProgressColor = (stats: TaskStats) => {
    if (stats.total === 0) return 'primary'
    const pct = Math.round((stats.done / stats.total) * 100)
    if (pct >= 80) return 'green'
    if (stats.overdue > 0) return 'red'
    if (pct >= 40) return 'yellow'
    return 'primary'
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 page-enter">
        {/* Summary skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-16 mb-2" />
              <div className="h-6 bg-gray-200 rounded w-10" />
            </div>
          ))}
        </div>
        {/* Strategy skeleton */}
        {[1,2,3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-48" />
                <div className="h-3 bg-gray-100 rounded w-96" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            Strategic Framework
          </h1>
          <p className="text-gray-500 mt-1 ml-[52px]">ภาพรวมยุทธศาสตร์ กลยุทธ์ และ KPI พร้อมสถานะความคืบหน้า</p>
        </div>
        <Button onClick={() => openModal('strategy')} className="btn-shine">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มยุทธศาสตร์
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 stagger-children">
        {[
          { label: 'ยุทธศาสตร์', value: totalStrategies, icon: '🏛️', color: 'from-indigo-500 to-purple-500' },
          { label: 'กลยุทธ์', value: totalTactics, icon: '🎯', color: 'from-blue-500 to-cyan-500' },
          { label: 'KPIs', value: totalKPIs, icon: '📊', color: 'from-emerald-500 to-teal-500' },
          { label: 'งานทั้งหมด', value: totalTasks, icon: '📋', color: 'from-orange-500 to-amber-500' },
          { label: 'เสร็จแล้ว', value: totalDone, icon: '✅', color: 'from-green-500 to-emerald-500' },
          { label: 'เกินกำหนด', value: totalOverdue, icon: '⚠️', color: 'from-red-500 to-rose-500' },
          { label: 'ความสำเร็จ', value: `${overallProgress}%`, icon: '🏆', color: 'from-yellow-500 to-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-soft p-4 card-hover">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Strategy Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 animate-fade-in-up [animation-delay:150ms]">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400" /> เสร็จ</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> กำลังทำ</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> บล็อก</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-200" /> รอดำเนินการ</span>
      </div>

      {/* Strategies List */}
      <div className="space-y-4 stagger-children">
        {strategies.map((strategy) => {
          const isExpanded = expandedStrategies.includes(strategy.id)
          const completionPct = strategy.taskStats.total > 0
            ? Math.round((strategy.taskStats.done / strategy.taskStats.total) * 100) : 0

          return (
            <div key={strategy.id} className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden card-hover transition-all duration-300">
              {/* Strategy Header */}
              <div className="p-5">
                <div className="flex items-center gap-4">
                  {/* Progress Ring */}
                  <div className="relative flex-shrink-0">
                    <ProgressRing progress={completionPct} color={getProgressColor(strategy.taskStats)} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-700">{completionPct}%</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-md shadow-sm">
                        {strategy.code}
                      </span>
                      <h2 className="font-semibold text-gray-900 truncate">{strategy.name}</h2>
                      {!strategy.active && <Badge variant="gray">ปิดใช้งาน</Badge>}
                      <HealthBadge stats={strategy.taskStats} />
                    </div>
                    {strategy.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{strategy.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">🎯 {strategy._count.tactics} กลยุทธ์</span>
                      <span className="flex items-center gap-1">📋 {strategy.taskStats.total} งาน</span>
                      <span className="flex items-center gap-1">✅ {strategy.taskStats.done} เสร็จ</span>
                      {strategy.taskStats.inProgress > 0 && (
                        <span className="flex items-center gap-1">🔄 {strategy.taskStats.inProgress} กำลังทำ</span>
                      )}
                    </div>
                    {/* Mini status bar */}
                    <div className="mt-2.5 max-w-md">
                      <StatusBar stats={strategy.taskStats} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => openModal('tactic', null, strategy.id)}>
                      + กลยุทธ์
                    </Button>
                    <button
                      onClick={() => openModal('strategy', strategy)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                      title="แก้ไขยุทธศาสตร์"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => toggleStrategy(strategy.id)}
                      className={cn(
                        'p-2 rounded-lg transition-all duration-200',
                        isExpanded ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                      )}
                      title={isExpanded ? 'ซ่อนกลยุทธ์' : 'แสดงกลยุทธ์'}
                    >
                      <svg className={cn('w-5 h-5 transition-transform duration-300 ease-spring', isExpanded && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tactics (Expanded) */}
              {isExpanded && (
                <div className="border-t border-gray-100 animate-fade-in-up">
                  {strategy.tactics.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">
                      ยังไม่มีกลยุทธ์ — กดปุ่ม &quot;+ กลยุทธ์&quot; เพื่อเพิ่ม
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {strategy.tactics.map((tactic) => {
                        const isTacticExpanded = expandedTactics.includes(tactic.id)
                        const tPct = tactic.taskStats.total > 0
                          ? Math.round((tactic.taskStats.done / tactic.taskStats.total) * 100) : 0

                        return (
                          <div key={tactic.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                            {/* Tactic Row */}
                            <div className="px-5 py-3 flex items-center gap-4">
                              {/* Small ring */}
                              <div className="relative flex-shrink-0 ml-8">
                                <ProgressRing progress={tPct} size={36} stroke={4} color={getProgressColor(tactic.taskStats)} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-gray-600">{tPct}%</span>
                                </div>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                    {tactic.code}
                                  </span>
                                  <span className="text-sm font-medium text-gray-800 truncate">{tactic.name}</span>
                                  {!tactic.active && <Badge variant="warning" className="text-xs">ปิด</Badge>}
                                </div>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                                  <span>{tactic._count.kpis} KPIs</span>
                                  <span>·</span>
                                  <span>{tactic.taskStats.total} งาน</span>
                                  {tactic.taskStats.done > 0 && (
                                    <span className="text-green-600">{tactic.taskStats.done} เสร็จ</span>
                                  )}
                                  {tactic.taskStats.overdue > 0 && (
                                    <span className="text-red-500 font-medium">⚠ {tactic.taskStats.overdue} เกินกำหนด</span>
                                  )}
                                </div>
                                {/* Tactic status bar */}
                                <div className="mt-1.5 max-w-xs">
                                  <StatusBar stats={tactic.taskStats} />
                                </div>
                              </div>

                              {/* Tactic Actions */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => router.push(`/tactics/${tactic.id}/tasks`)}
                                  className="px-2.5 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors duration-200"
                                  title="ดูงานในกลยุทธ์นี้"
                                >
                                  📋 ดูงาน
                                </button>
                                <button
                                  onClick={() => openModal('kpi', null, tactic.id)}
                                  className="px-2.5 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                                >
                                  + KPI
                                </button>
                                <button
                                  onClick={() => openModal('tactic', tactic, strategy.id)}
                                  className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                                  title="แก้ไขกลยุทธ์"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => toggleTactic(tactic.id)}
                                  className={cn(
                                    'p-1.5 rounded-lg transition-all duration-200',
                                    isTacticExpanded ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:bg-gray-100'
                                  )}
                                  title={isTacticExpanded ? 'ซ่อน KPI' : 'แสดง KPI'}
                                >
                                  <svg className={cn('w-4 h-4 transition-transform duration-300 ease-spring', isTacticExpanded && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* KPIs (Expanded) */}
                            {isTacticExpanded && tactic.kpis.length > 0 && (
                              <div className="ml-16 mr-5 mb-3 animate-fade-in-up">
                                <div className="bg-gray-50/80 rounded-xl p-3 space-y-1.5">
                                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">
                                    ตัวชี้วัด (KPIs)
                                  </div>
                                  {tactic.kpis.map((kpi) => (
                                    <div
                                      key={kpi.id}
                                      className="flex items-center justify-between p-2 bg-white rounded-lg hover:shadow-sm transition-all duration-200 group"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                          📊
                                        </span>
                                        <span className="text-xs font-medium text-gray-500">{kpi.code}</span>
                                        <span className="text-sm text-gray-700 truncate">{kpi.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <Badge variant="info" className="text-[10px]">{kpi.unit}</Badge>
                                        <span className={cn(
                                          'text-[10px] px-1.5 py-0.5 rounded font-medium',
                                          kpi._count.values > 0 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                                        )}>
                                          {kpi._count.values > 0 ? `${kpi._count.values} ค่า` : 'ยังไม่มีข้อมูล'}
                                        </span>
                                        <span className={cn(
                                          'text-[10px] px-1.5 py-0.5 rounded font-medium',
                                          kpi._count.taskKpis > 0 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                                        )}>
                                          {kpi._count.taskKpis} งานเชื่อมโยง
                                        </span>
                                        {!kpi.active && <Badge variant="warning" className="text-[10px]">ปิด</Badge>}
                                        <button
                                          onClick={() => openModal('kpi', kpi, tactic.id)}
                                          className="p-1 text-gray-300 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
                                          title="แก้ไข KPI"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {isTacticExpanded && tactic.kpis.length === 0 && (
                              <div className="ml-16 mr-5 mb-3 animate-fade-in-up">
                                <div className="bg-gray-50/60 rounded-xl p-4 text-center text-sm text-gray-400">
                                  ยังไม่มี KPI — กดปุ่ม &quot;+ KPI&quot; เพื่อเพิ่มตัวชี้วัด
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {strategies.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-12 text-center animate-fade-in-up">
            <div className="text-4xl mb-3">🏛️</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">ยังไม่มียุทธศาสตร์</h3>
            <p className="text-gray-500 text-sm mb-4">เริ่มต้นสร้างยุทธศาสตร์องค์กรของคุณ</p>
            <Button onClick={() => openModal('strategy')} className="btn-shine">
              + เพิ่มยุทธศาสตร์แรก
            </Button>
          </div>
        )}
      </div>

      <EditModal
        type={modalType}
        item={modalItem}
        parentId={modalParentId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={fetchStrategies}
      />
    </div>
  )
}
