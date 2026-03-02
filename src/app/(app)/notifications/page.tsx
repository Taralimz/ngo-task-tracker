'use client'

import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

const typeIcons: Record<string, string> = {
  TASK_ASSIGNED: '📋',
  TASK_UPDATED: '🔄',
  TASK_COMMENT: '💬',
  TASK_DUE_SOON: '⏰',
  TASK_OVERDUE: '🚨',
  KPI_REMINDER: '📊',
}

const typeLabels: Record<string, string> = {
  TASK_ASSIGNED: 'มอบหมายงาน',
  TASK_UPDATED: 'อัปเดตงาน',
  TASK_COMMENT: 'ความคิดเห็น',
  TASK_DUE_SOON: 'ใกล้ครบกำหนด',
  TASK_OVERDUE: 'เลยกำหนด',
  KPI_REMINDER: 'แจ้งเตือน KPI',
}

const typeBgColors: Record<string, string> = {
  TASK_ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200',
  TASK_UPDATED: 'bg-amber-50 text-amber-700 border-amber-200',
  TASK_COMMENT: 'bg-purple-50 text-purple-700 border-purple-200',
  TASK_DUE_SOON: 'bg-orange-50 text-orange-700 border-orange-200',
  TASK_OVERDUE: 'bg-red-50 text-red-700 border-red-200',
  KPI_REMINDER: 'bg-teal-50 text-teal-700 border-teal-200',
}

type FilterType = 'all' | 'unread' | 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'TASK_COMMENT' | 'TASK_DUE_SOON' | 'TASK_OVERDUE' | 'KPI_REMINDER'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [deleting, setDeleting] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('limit', '100')
      if (filter === 'unread') {
        params.set('unread', 'true')
      }
      const res = await fetch(`/api/notifications?${params}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = async (ids: number[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteAllRead = async () => {
    setDeleting(true)
    try {
      await fetch('/api/notifications', { method: 'DELETE' })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to delete:', error)
    } finally {
      setDeleting(false)
    }
  }

  const deleteAll = async () => {
    setDeleting(true)
    try {
      await fetch('/api/notifications?all=true', { method: 'DELETE' })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to delete all:', error)
    } finally {
      setDeleting(false)
    }
  }

  const deleteSingle = async (id: number) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead([notification.id])
    }
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'เมื่อสักครู่'
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
    if (days < 7) return `${days} วันที่แล้ว`
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all' || filter === 'unread') return true
    return n.type === filter
  })

  const filterButtons: { key: FilterType; label: string; icon?: string }[] = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'unread', label: 'ยังไม่อ่าน' },
    { key: 'TASK_ASSIGNED', label: 'มอบหมาย', icon: '📋' },
    { key: 'TASK_UPDATED', label: 'อัปเดต', icon: '🔄' },
    { key: 'TASK_COMMENT', label: 'ความคิดเห็น', icon: '💬' },
    { key: 'TASK_DUE_SOON', label: 'ใกล้กำหนด', icon: '⏰' },
    { key: 'TASK_OVERDUE', label: 'เลยกำหนด', icon: '🚨' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การแจ้งเตือน</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `คุณมี ${unreadCount} การแจ้งเตือนที่ยังไม่ได้อ่าน` : 'ไม่มีการแจ้งเตือนใหม่'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-all duration-200"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                อ่านทั้งหมด
              </span>
            </button>
          )}
          <button
            onClick={deleteAllRead}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              ลบที่อ่านแล้ว
            </span>
          </button>
          <button
            onClick={deleteAll}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              ลบทั้งหมด
            </span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 border',
              filter === btn.key
                ? 'bg-primary-50 text-primary-700 border-primary-200 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            )}
          >
            {btn.icon && <span className="mr-1">{btn.icon}</span>}
            {btn.label}
            {btn.key === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-3 text-sm text-gray-500">กำลังโหลด...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-gray-500 font-medium">ไม่มีการแจ้งเตือน</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'unread' ? 'คุณอ่านการแจ้งเตือนทั้งหมดแล้ว' : 'ยังไม่มีการแจ้งเตือนในขณะนี้'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification, index) => (
              <div
                key={notification.id}
                className={cn(
                  'group flex items-start gap-4 p-4 hover:bg-gray-50/80 transition-all duration-200 cursor-pointer animate-fade-in',
                  !notification.read && 'bg-blue-50/40'
                )}
                style={{ animationDelay: `${index * 30}ms` }}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl">
                  {typeIcons[notification.type] || '📌'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={cn(
                      'text-sm',
                      !notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                    )}>
                      {notification.title}
                    </p>
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border',
                      typeBgColors[notification.type] || 'bg-gray-50 text-gray-600 border-gray-200'
                    )}>
                      {typeLabels[notification.type] || notification.type}
                    </span>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead([notification.id])
                      }}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                      title="ทำเครื่องหมายว่าอ่านแล้ว"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSingle(notification.id)
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="ลบ"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
