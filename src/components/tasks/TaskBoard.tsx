'use client'

import { useState } from 'react'
import { TaskCard } from './TaskCard'
import { Task, TaskStatus } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface TaskBoardProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onStatusChange?: (taskId: number, status: TaskStatus) => Promise<void>
}

const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'TO_DO', label: 'รอดำเนินการ', color: 'bg-gray-100' },
  { status: 'IN_PROGRESS', label: 'กำลังดำเนินการ', color: 'bg-blue-50' },
  { status: 'BLOCKED', label: 'ติดขัด', color: 'bg-red-50' },
  { status: 'DONE', label: 'เสร็จสิ้น', color: 'bg-green-50' },
]

export function TaskBoard({ tasks, onTaskClick, onStatusChange }: TaskBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status)
  }

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id.toString())
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColumn !== status) {
      setDragOverColumn(status)
    }
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedTask || draggedTask.status === newStatus) {
      return
    }

    if (onStatusChange) {
      try {
        await onStatusChange(draggedTask.id, newStatus)
      } catch (error) {
        toast.error('ไม่สามารถเปลี่ยนสถานะได้')
      }
    }
  }

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4 scrollbar-thin">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.status)
        const isDropTarget = dragOverColumn === column.status

        return (
          <div
            key={column.status}
            className={cn(
              'flex-1 min-w-[300px] max-w-[350px] rounded-2xl flex flex-col transition-all duration-300',
              column.color,
              isDropTarget && 'ring-2 ring-primary-400 ring-offset-2 scale-[1.01]'
            )}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            {/* Column Header */}
            <div className="p-3 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 text-sm">{column.label}</h3>
                <span className="text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full font-medium shadow-sm">
                  {columnTasks.length}
                </span>
              </div>
            </div>

            {/* Column Body */}
            <div
              className={cn(
                'flex-1 p-2.5 space-y-2 overflow-y-auto scrollbar-thin transition-all duration-300',
                isDropTarget && 'bg-primary-50/80'
              )}
            >
              {columnTasks.length === 0 ? (
                <div
                  className={cn(
                    'h-24 flex items-center justify-center text-sm text-gray-400 border-2 border-dashed rounded-xl transition-all duration-300',
                    isDropTarget
                      ? 'border-primary-300 bg-primary-50/50 text-primary-500'
                      : 'border-gray-200'
                  )}
                >
                  {isDropTarget ? 'ปล่อยที่นี่' : 'ว่าง'}
                </div>
              ) : (
                columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'cursor-grab active:cursor-grabbing transition-all duration-200',
                      draggedTask?.id === task.id && 'opacity-40 scale-95 rotate-1'
                    )}
                  >
                    <TaskCard
                      task={task}
                      view="board"
                      onClick={() => onTaskClick(task)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
