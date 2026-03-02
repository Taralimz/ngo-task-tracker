'use client'

import { useState, useEffect } from 'react'
import { Drawer, Badge, Button, Textarea, Select } from '@/components/ui'
import { Task, TaskStatus, TaskPriority, TaskDetail } from '@/types'
import { cn, formatThaiDate, getStatusColor, getPriorityColor, getStatusLabel, getPriorityLabel } from '@/lib/utils'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

interface TaskDrawerProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

const statusOptions = [
  { value: 'TO_DO', label: 'รอดำเนินการ' },
  { value: 'IN_PROGRESS', label: 'กำลังดำเนินการ' },
  { value: 'BLOCKED', label: 'ติดขัด' },
  { value: 'DONE', label: 'เสร็จสิ้น' },
]

const priorityOptions = [
  { value: 'LOW', label: 'ต่ำ' },
  { value: 'NORMAL', label: 'ปกติ' },
  { value: 'HIGH', label: 'สูง' },
  { value: 'URGENT', label: 'เร่งด่วน' },
]

export function TaskDrawer({ task, isOpen, onClose, onUpdate }: TaskDrawerProps) {
  const [detail, setDetail] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'detail' | 'updates' | 'comments'>('detail')
  
  const [updateContent, setUpdateContent] = useState('')
  const [newProgress, setNewProgress] = useState<number>(0)
  const [commentContent, setCommentContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (task && isOpen) {
      fetchTaskDetail()
    }
  }, [task?.id, isOpen])

  const fetchTaskDetail = async () => {
    if (!task) return
    setLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`)
      if (response.ok) {
        const data = await response.json()
        setDetail(data)
        setNewProgress(data.progress || 0)
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลงานได้')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (status: TaskStatus) => {
    if (!task) return
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (response.ok) {
        toast.success('อัปเดตสถานะสำเร็จ')
        fetchTaskDetail()
        onUpdate?.()
      }
    } catch (error) {
      toast.error('ไม่สามารถอัปเดตสถานะได้')
    }
  }

  const handlePriorityChange = async (priority: TaskPriority) => {
    if (!task) return
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      })
      if (response.ok) {
        toast.success('อัปเดตความสำคัญสำเร็จ')
        fetchTaskDetail()
        onUpdate?.()
      }
    } catch (error) {
      toast.error('ไม่สามารถอัปเดตความสำคัญได้')
    }
  }

  const handleSubmitUpdate = async () => {
    if (!task || !updateContent.trim()) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: updateContent.trim(),
          newProgress,
        }),
      })
      if (response.ok) {
        toast.success('บันทึกความคืบหน้าสำเร็จ')
        setUpdateContent('')
        fetchTaskDetail()
        onUpdate?.()
      }
    } catch (error) {
      toast.error('ไม่สามารถบันทึกความคืบหน้าได้')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!task || !commentContent.trim()) return
    setSubmitting(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentContent.trim() }),
      })
      if (response.ok) {
        toast.success('เพิ่มความคิดเห็นสำเร็จ')
        setCommentContent('')
        fetchTaskDetail()
      }
    } catch (error) {
      toast.error('ไม่สามารถเพิ่มความคิดเห็นได้')
    } finally {
      setSubmitting(false)
    }
  }

  if (!task) return null

  const priorityIcons: Record<TaskPriority, { icon: string; color: string }> = {
    URGENT: { icon: '🔴', color: 'text-red-600 bg-red-50 border-red-200' },
    HIGH: { icon: '🟠', color: 'text-orange-600 bg-orange-50 border-orange-200' },
    NORMAL: { icon: '🔵', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    LOW: { icon: '⚪', color: 'text-gray-600 bg-gray-50 border-gray-200' },
  }

  const statusIcons: Record<TaskStatus, { icon: string; color: string }> = {
    TO_DO: { icon: '⏳', color: 'text-gray-600 bg-gray-100 border-gray-300' },
    IN_PROGRESS: { icon: '🔄', color: 'text-blue-600 bg-blue-100 border-blue-300' },
    BLOCKED: { icon: '🚫', color: 'text-red-600 bg-red-100 border-red-300' },
    DONE: { icon: '✅', color: 'text-green-600 bg-green-100 border-green-300' },
  }

  const currentProgress = detail?.progress || 0
  const progressColor = currentProgress === 100 ? 'bg-green-500' : currentProgress >= 75 ? 'bg-blue-500' : currentProgress >= 50 ? 'bg-primary-500' : currentProgress >= 25 ? 'bg-yellow-500' : 'bg-gray-400'

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="" width="xl">
      <div className="flex flex-col h-full">
        {/* Header with gradient background */}
        <div className="pb-4 border-b bg-gradient-to-r from-primary-50 to-blue-50 -mx-6 px-6 pt-2 -mt-4 rounded-t-lg">
          {/* Org + Strategic breadcrumb */}
          <div className="flex items-center gap-2 text-xs mb-3 flex-wrap">
            {detail?.org && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100/80 text-purple-700 rounded-md font-medium shadow-sm">
                🏢 {detail.org.name}
              </span>
            )}
            {detail?.strategy && (
              <>
                {detail?.org && (
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/80 text-primary-700 rounded-md font-medium shadow-sm">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {detail.strategy.code}
                </span>
              </>
            )}
            {detail?.strategy && detail?.tactic && (
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {detail?.tactic && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/80 text-blue-700 rounded-md font-medium shadow-sm">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {detail.tactic.code}
              </span>
            )}
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-4 leading-tight">{task.title}</h2>
          
          {/* Status and Priority - Card Style */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
              statusIcons[detail?.status || task.status]?.color
            )}>
              <span>{statusIcons[detail?.status || task.status]?.icon}</span>
              <select
                value={detail?.status || task.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="text-sm font-medium bg-transparent border-0 focus:ring-0 cursor-pointer pr-6"
                title="สถานะงาน"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
              priorityIcons[detail?.priority || task.priority]?.color
            )}>
              <span>{priorityIcons[detail?.priority || task.priority]?.icon}</span>
              <select
                value={detail?.priority || task.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
                className="text-sm font-medium bg-transparent border-0 focus:ring-0 cursor-pointer pr-6"
                title="ลำดับความสำคัญ"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Progress Bar - Enhanced */}
        <div className="py-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">ความคืบหน้า</span>
            </div>
            <span className={cn(
              'text-lg font-bold',
              currentProgress === 100 ? 'text-green-600' : currentProgress >= 50 ? 'text-primary-600' : 'text-gray-600'
            )}>
              {currentProgress}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div
              className={cn('h-full rounded-full transition-all duration-500', progressColor)}
              ref={(el) => { if (el) el.style.width = `${currentProgress}%` }}
              role="presentation"
              aria-hidden="true"
            />
          </div>
          {currentProgress === 100 && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              งานเสร็จสมบูรณ์แล้ว
            </p>
          )}
        </div>

        {/* Tabs - Modern Style */}
        <div className="flex gap-1 py-3 border-b bg-gray-50/50 -mx-6 px-6">
          {[
            { id: 'detail', label: 'รายละเอียด', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )},
            { id: 'updates', label: 'ความคืบหน้า', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ), count: detail?.updates?.length },
            { id: 'comments', label: 'ความคิดเห็น', icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            ), count: detail?.comments?.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white hover:shadow-sm'
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  'ml-1 px-1.5 py-0.5 text-xs rounded-full',
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
              <p className="mt-3 text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <>
              {/* Detail Tab */}
              {activeTab === 'detail' && (
                <div className="space-y-6">
                  {/* Description */}
                  <div className="bg-white rounded-xl border p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900">รายละเอียดงาน</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {detail?.description || 'ไม่มีรายละเอียด'}
                    </p>
                  </div>

                  {/* Dates - Card Style */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-green-700 uppercase tracking-wide">วันเริ่มต้น</span>
                      </div>
                      <p className="text-lg font-semibold text-green-800">
                        {detail?.startDate ? formatThaiDate(detail.startDate) : '-'}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-orange-700 uppercase tracking-wide">วันครบกำหนด</span>
                      </div>
                      <p className="text-lg font-semibold text-orange-800">
                        {detail?.dueDate ? formatThaiDate(detail.dueDate) : '-'}
                      </p>
                    </div>
                  </div>

                  {/* KPIs - Enhanced Cards */}
                  <div className="bg-white rounded-xl border p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900">KPI ที่เกี่ยวข้อง</h4>
                      {detail?.taskKpis && detail.taskKpis.length > 0 && (
                        <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                          {detail.taskKpis.length} KPI
                        </span>
                      )}
                    </div>
                    {detail?.taskKpis && detail.taskKpis.length > 0 ? (
                      <div className="space-y-3">
                        {detail.taskKpis.map((tk) => (
                          <div
                            key={tk.kpi.id}
                            className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-primary-700">{tk.kpi.code}</span>
                                  <Badge
                                    variant={tk.contributionType === 'DIRECT' ? 'success' : 'info'}
                                    size="sm"
                                  >
                                    {tk.contributionType === 'DIRECT' ? '✓ ส่งผลโดยตรง' : '○ สนับสนุน'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{tk.kpi.name}</p>
                                {tk.expectedContributionNote && (
                                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    คาดหวัง: {tk.expectedContributionNote}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-gray-400">
                        <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-sm">ยังไม่มี KPI ที่เชื่อมโยง</p>
                      </div>
                    )}
                  </div>

                  {/* Assignees - Enhanced */}
                  <div className="bg-white rounded-xl border p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900">ผู้รับผิดชอบ</h4>
                      {detail?.assignees && detail.assignees.length > 0 && (
                        <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                          {detail.assignees.length} คน
                        </span>
                      )}
                    </div>
                    {detail?.assignees && detail.assignees.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {detail.assignees.map((a) => (
                          <div
                            key={a.user.id}
                            className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border hover:shadow-sm transition-shadow"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center text-sm font-bold shadow flex-shrink-0">
                              {a.user.fullName?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{a.user.fullName}</p>
                              <p className="text-xs text-gray-500 truncate">{a.user.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-gray-400">
                        <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-sm">ยังไม่มีผู้รับผิดชอบ</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Updates Tab - Enhanced */}
              {activeTab === 'updates' && (
                <div className="space-y-4">
                  {/* Add Update Form */}
                  <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl border border-primary-100 space-y-4">
                    <div className="flex items-center gap-2 text-primary-700 font-medium">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      รายงานความคืบหน้าใหม่
                    </div>
                    <Textarea
                      value={updateContent}
                      onChange={(e) => setUpdateContent(e.target.value)}
                      placeholder="รายงานความคืบหน้าของงาน เช่น สิ่งที่ทำเสร็จแล้ว ปัญหาที่เจอ..."
                      rows={3}
                      className="bg-white"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border">
                        <span className="text-sm text-gray-600">ความคืบหน้า:</span>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={newProgress}
                          onChange={(e) => setNewProgress(Number(e.target.value))}
                          className="w-24 accent-primary-500"
                          title="ความคืบหน้า"
                        />
                        <span className={cn(
                          'text-sm font-bold min-w-[3rem] text-right',
                          newProgress === 100 ? 'text-green-600' : 'text-primary-600'
                        )}>
                          {newProgress}%
                        </span>
                      </div>
                      <Button
                        onClick={handleSubmitUpdate}
                        loading={submitting}
                        disabled={!updateContent.trim()}
                        className="shadow-sm"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        บันทึก
                      </Button>
                    </div>
                  </div>

                  {/* Updates Timeline - Enhanced */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      ประวัติการอัปเดต
                    </h4>
                    {detail?.updates && detail.updates.length > 0 ? (
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                        {detail.updates.map((update, idx) => (
                          <div key={update.id} className="relative pl-10 pb-6">
                            <div className={cn(
                              'absolute left-2.5 w-4 h-4 rounded-full border-2 border-white shadow',
                              idx === 0 ? 'bg-primary-500' : 'bg-gray-300'
                            )} />
                            <div className="bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                                    {update.user.fullName?.charAt(0) || '?'}
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">{update.user.fullName}</span>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {format(new Date(update.createdAt), 'd MMM yyyy, HH:mm', { locale: th })}
                                </span>
                              </div>
                              {update.previousProgress !== null && update.newProgress !== null && (
                                <div className="flex items-center gap-2 mb-2 text-sm">
                                  <span className="text-gray-500">{update.previousProgress}%</span>
                                  <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                  </svg>
                                  <span className={cn(
                                    'font-bold',
                                    update.newProgress === 100 ? 'text-green-600' : 'text-primary-600'
                                  )}>
                                    {update.newProgress}%
                                  </span>
                                </div>
                              )}
                              <p className="text-sm text-gray-600">{update.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-xl">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm font-medium">ยังไม่มีการบันทึกความคืบหน้า</p>
                        <p className="text-xs mt-1">เริ่มรายงานความคืบหน้าของคุณด้านบน</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comments Tab - Enhanced */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {/* Add Comment Form */}
                  <div className="flex gap-3 items-start bg-gray-50 rounded-xl p-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      @
                    </div>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="เขียนความคิดเห็นของคุณ..."
                        rows={2}
                        className="bg-white"
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleSubmitComment}
                          loading={submitting}
                          disabled={!commentContent.trim()}
                          size="sm"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          ส่งความคิดเห็น
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Comments List - Enhanced */}
                  <div className="space-y-3">
                    {detail?.comments && detail.comments.length > 0 ? (
                      detail.comments.map((comment) => (
                        <div key={comment.id} className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {comment.user.fullName?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900">{comment.user.fullName}</span>
                                <span className="text-xs text-gray-400">
                                  {format(new Date(comment.createdAt), 'd MMM yyyy, HH:mm', { locale: th })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-xl">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-sm font-medium">ยังไม่มีความคิดเห็น</p>
                        <p className="text-xs mt-1">เริ่มพูดคุยเกี่ยวกับงานนี้</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Drawer>
  )
}
