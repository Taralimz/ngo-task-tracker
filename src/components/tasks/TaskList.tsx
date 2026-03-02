'use client'

import { useState } from 'react'
import { TaskCard } from './TaskCard'
import { Select } from '@/components/ui'
import { Task, TaskStatus, TaskPriority } from '@/types'
import { cn } from '@/lib/utils'

interface TaskListProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onStatusChange?: (taskId: number, status: TaskStatus) => void
}

type SortOption = 'newest' | 'oldest' | 'priority' | 'due_date' | 'status'

const sortOptions = [
  { value: 'newest', label: 'ใหม่สุด' },
  { value: 'oldest', label: 'เก่าสุด' },
  { value: 'priority', label: 'ความสำคัญ' },
  { value: 'due_date', label: 'วันครบกำหนด' },
  { value: 'status', label: 'สถานะ' },
]

const priorityOrder: Record<TaskPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
}

const statusOrder: Record<TaskStatus, number> = {
  IN_PROGRESS: 0,
  TO_DO: 1,
  BLOCKED: 2,
  DONE: 3,
}

export function TaskList({ tasks, onTaskClick, onStatusChange }: TaskListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [groupBy, setGroupBy] = useState<'none' | 'status' | 'priority'>('none')

  const sortedTasks = [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'priority':
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      case 'due_date':
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      case 'status':
        return statusOrder[a.status] - statusOrder[b.status]
      default:
        return 0
    }
  })

  const groupedTasks = () => {
    if (groupBy === 'none') {
      return [{ key: 'all', label: '', tasks: sortedTasks }]
    }

    if (groupBy === 'status') {
      const groups: Record<TaskStatus, Task[]> = {
        TO_DO: [],
        IN_PROGRESS: [],
        BLOCKED: [],
        DONE: [],
      }
      sortedTasks.forEach((task) => {
        groups[task.status].push(task)
      })
      return [
        { key: 'TO_DO', label: 'รอดำเนินการ', tasks: groups.TO_DO },
        { key: 'IN_PROGRESS', label: 'กำลังดำเนินการ', tasks: groups.IN_PROGRESS },
        { key: 'BLOCKED', label: 'ติดขัด', tasks: groups.BLOCKED },
        { key: 'DONE', label: 'เสร็จสิ้น', tasks: groups.DONE },
      ].filter((g) => g.tasks.length > 0)
    }

    if (groupBy === 'priority') {
      const groups: Record<TaskPriority, Task[]> = {
        URGENT: [],
        HIGH: [],
        NORMAL: [],
        LOW: [],
      }
      sortedTasks.forEach((task) => {
        groups[task.priority].push(task)
      })
      return [
        { key: 'URGENT', label: 'เร่งด่วน', tasks: groups.URGENT },
        { key: 'HIGH', label: 'สูง', tasks: groups.HIGH },
        { key: 'NORMAL', label: 'ปกติ', tasks: groups.NORMAL },
        { key: 'LOW', label: 'ต่ำ', tasks: groups.LOW },
      ].filter((g) => g.tasks.length > 0)
    }

    return [{ key: 'all', label: '', tasks: sortedTasks }]
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pb-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">เรียงตาม:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-sm border rounded-lg px-3 py-1.5"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">จัดกลุ่มตาม:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as any)}
            className="text-sm border rounded-lg px-3 py-1.5"
          >
            <option value="none">ไม่จัดกลุ่ม</option>
            <option value="status">สถานะ</option>
            <option value="priority">ความสำคัญ</option>
          </select>
        </div>

        <div className="sm:ml-auto text-sm text-gray-500">
          {tasks.length} งาน
        </div>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
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
          <p>ไม่มีงานในขณะนี้</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedTasks().map((group) => (
            <div key={group.key}>
              {group.label && (
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-medium text-gray-700">{group.label}</h3>
                  <span className="text-xs text-gray-400">({group.tasks.length})</span>
                </div>
              )}
              <div className="space-y-2">
                {group.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    view="list"
                    onClick={() => onTaskClick(task)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
