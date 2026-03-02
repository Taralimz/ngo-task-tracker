'use client'

import { Task, TaskStatus, TaskPriority } from '@/types'
import { Badge } from '@/components/ui'
import { formatDate, isOverdue, statusLabels, statusColors, priorityColors, priorityLabels } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  view?: 'list' | 'board'
}

const priorityIcons: Record<TaskPriority, string> = {
  URGENT: '🔴',
  HIGH: '🟠',
  NORMAL: '🔵',
  LOW: '⚪',
}

export function TaskCard({ task, onClick, view = 'list' }: TaskCardProps) {
  const overdue = isOverdue(task.dueDate) && task.status !== 'DONE'
  const taskKpis = task.taskKpis || []
  const assignees = task.assignees || []
  const progress = task.progress || 0

  if (view === 'board') {
    return (
      <div
        onClick={onClick}
        className={cn(
          'bg-white rounded-xl border p-3.5 cursor-pointer card-hover group',
          'hover:border-gray-300',
          overdue && 'border-red-200 bg-red-50/30',
          task.priority === 'URGENT' && 'border-l-4 border-l-red-500',
          task.priority === 'HIGH' && 'border-l-4 border-l-orange-500'
        )}
      >
        {/* Priority & Status */}
        <div className="flex items-center justify-between mb-2">
          <Badge className={statusColors[task.status]} size="sm">
            {statusLabels[task.status]}
          </Badge>
          <span title={priorityLabels[task.priority]}>{priorityIcons[task.priority]}</span>
        </div>

        <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">{task.title}</h4>
        
        <div className="flex flex-wrap gap-1 mb-2">
          {task.org && (
            <Badge variant="default" size="sm" className="bg-purple-50 text-purple-600 border-purple-200">🏢 {task.org.name}</Badge>
          )}
          {task.strategy && <Badge variant="gray" size="sm">{task.strategy.code}</Badge>}
          {taskKpis.slice(0, 2).map((tk) => (
            <Badge key={tk.kpi.id} variant="info" size="sm">{tk.kpi.code}</Badge>
          ))}
          {taskKpis.length > 2 && (
            <Badge variant="gray" size="sm">+{taskKpis.length - 2}</Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className={cn(overdue && 'text-red-600 font-medium flex items-center gap-1')}>
            {overdue && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {formatDate(task.dueDate)}
          </span>
          <div className="flex -space-x-1">
            {assignees.slice(0, 3).map((a) => (
              <div
                key={a.user.id}
                className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 text-white rounded-full flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm transition-transform duration-200 hover:scale-110 hover:z-10"
                title={a.user.fullName}
              >
                {a.user.fullName?.charAt(0) || '?'}
              </div>
            ))}
          </div>
        </div>

        {progress > 0 && (
          <div className="mt-2.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-smooth progress-animated',
                task.status === 'DONE' ? 'bg-gradient-to-r from-green-400 to-green-500' : progress >= 80 ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-primary-400 to-primary-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    )
  }

  // List view - improved
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border p-3 sm:p-4 cursor-pointer card-hover group',
        'hover:border-gray-300',
        overdue && 'border-red-200 bg-red-50/30',
        task.priority === 'URGENT' && 'border-l-4 border-l-red-500',
        task.priority === 'HIGH' && 'border-l-4 border-l-orange-500'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        {/* Checkbox */}
        <div className="pt-0.5 hidden sm:block">
          <div className={cn(
            'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300',
            task.status === 'DONE' ? 'bg-green-500 border-green-500 shadow-glow-success scale-100' : 'border-gray-300 group-hover:border-primary-400 group-hover:scale-110'
          )}>
            {task.status === 'DONE' && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Strategic breadcrumb + Org */}
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            {task.org && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-[11px] font-medium">
                🏢 {task.org.name}
              </span>
            )}
            {(task.strategy || task.tactic) && (
              <span className="flex items-center gap-1">
                {task.strategy && <span className="font-medium text-gray-500">{task.strategy.code}</span>}
                {task.strategy && task.tactic && <span>›</span>}
                {task.tactic && <span>{task.tactic.code}</span>}
              </span>
            )}
          </div>

          <h4 className="font-medium text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-200">{task.title}</h4>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusColors[task.status]} size="sm">
              {statusLabels[task.status]}
            </Badge>
            <span title={priorityLabels[task.priority]} className="text-sm">{priorityIcons[task.priority]}</span>
            
            {/* KPI badges */}
            {taskKpis.slice(0, 3).map((tk) => (
              <Badge key={tk.kpi.id} variant="info" size="sm">
                {tk.kpi.code}
              </Badge>
            ))}
            {taskKpis.length > 3 && (
              <Badge variant="gray" size="sm">+{taskKpis.length - 3} KPI</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
          {/* Due date */}
          <div className={cn(
            'text-xs sm:text-sm flex items-center gap-1',
            overdue ? 'text-red-600 font-medium' : 'text-gray-500'
          )}>
            {overdue && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(task.dueDate)}
          </div>

          {/* Assignees */}
          {assignees.length > 0 && (
            <div className="flex -space-x-2">
              {assignees.slice(0, 3).map((a) => (
                <div
                  key={a.user.id}
                  className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm"
                  title={a.user.fullName}
                >
                  {a.user.fullName?.charAt(0) || '?'}
                </div>
              ))}
              {assignees.length > 3 && (
                <div className="w-7 h-7 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm">
                  +{assignees.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Progress */}
          {progress > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-smooth',
                    task.status === 'DONE' ? 'bg-gradient-to-r from-green-400 to-green-500' : progress >= 80 ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-primary-400 to-primary-500'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 font-medium">{progress}%</span>
            </div>
          )}

          {/* Counts */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {task._count && task._count.comments > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {task._count.comments}
              </span>
            )}
            {task._count && task._count.attachments > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {task._count.attachments}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
