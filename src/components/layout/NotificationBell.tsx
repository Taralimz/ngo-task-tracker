'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
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

const typeBadgeColors: Record<string, string> = {
  TASK_ASSIGNED: 'bg-blue-100 text-blue-700',
  TASK_UPDATED: 'bg-amber-100 text-amber-700',
  TASK_COMMENT: 'bg-purple-100 text-purple-700',
  TASK_DUE_SOON: 'bg-orange-100 text-orange-700',
  TASK_OVERDUE: 'bg-red-100 text-red-700',
  KPI_REMINDER: 'bg-teal-100 text-teal-700',
}

const typeLabels: Record<string, string> = {
  TASK_ASSIGNED: 'มอบหมาย',
  TASK_UPDATED: 'อัปเดต',
  TASK_COMMENT: 'ความคิดเห็น',
  TASK_DUE_SOON: 'ใกล้กำหนด',
  TASK_OVERDUE: 'เลยกำหนด',
  KPI_REMINDER: 'KPI',
}

export function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const deleteSingle = async (id: number) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' })
      fetchNotifications()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead([notification.id])
    }
    if (notification.link) {
      router.push(notification.link)
    }
    setIsOpen(false)
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
    return date.toLocaleDateString('th-TH')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
      >
        <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center notification-badge shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white/95 backdrop-blur-xl rounded-xl shadow-elevated border border-gray-200/60 z-50 animate-fade-in-down overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">การแจ้งเตือน</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                  {unreadCount} ใหม่
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700 hover:underline font-medium"
              >
                อ่านทั้งหมด
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-gray-500 font-medium text-sm">ไม่มีการแจ้งเตือน</p>
                <p className="text-xs text-gray-400 mt-0.5">การแจ้งเตือนจะปรากฏที่นี่</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={cn(
                    'group relative p-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 transition-all duration-200 cursor-pointer',
                    !notification.read && 'bg-blue-50/40'
                  )}
                >
                  <div className="flex gap-3" onClick={() => handleNotificationClick(notification)}>
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {typeIcons[notification.type] || '📌'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className={cn('text-sm leading-tight', !notification.read && 'font-semibold')}>
                          {notification.title}
                        </p>
                        <span className={cn(
                          'inline-flex px-1.5 py-0.5 text-[9px] font-medium rounded-full flex-shrink-0',
                          typeBadgeColors[notification.type] || 'bg-gray-100 text-gray-600'
                        )}>
                          {typeLabels[notification.type] || notification.type}
                        </span>
                        {!notification.read && (
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                  {/* Hover actions */}
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead([notification.id])
                        }}
                        className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-all"
                        title="ทำเครื่องหมายว่าอ่านแล้ว"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSingle(notification.id)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                      title="ลบ"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-gray-100">
            <button
              onClick={() => {
                router.push('/notifications')
                setIsOpen(false)
              }}
              className="w-full text-center text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg py-2 transition-all duration-200 font-medium"
            >
              ดูทั้งหมด
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
