'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthUser } from '@/lib/auth'
import { Badge } from '@/components/ui'
import { cn, roleLabels } from '@/lib/utils'
import { NotificationBell } from './NotificationBell'

interface SearchResult {
  id: number
  title: string
  status: string
  priority: string
  strategy?: { code: string }
  tactic?: { code: string }
}

interface HeaderProps {
  user: AuthUser
  onLogout?: () => void
  onMenuToggle?: () => void
}

const statusLabels: Record<string, string> = {
  TO_DO: 'รอดำเนินการ',
  IN_PROGRESS: 'กำลังทำ',
  BLOCKED: 'ติดขัด',
  DONE: 'เสร็จ',
}
const statusColors: Record<string, string> = {
  TO_DO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  BLOCKED: 'bg-red-100 text-red-700',
  DONE: 'bg-green-100 text-green-700',
}
const priorityColors: Record<string, string> = {
  LOW: 'text-gray-400',
  NORMAL: 'text-blue-500',
  HIGH: 'text-orange-500',
  URGENT: 'text-red-500',
}

export function Header({ user, onLogout, onMenuToggle }: HeaderProps) {
  const router = useRouter()
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search
  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    try {
      const params = new URLSearchParams({ search: query, limit: '8' })
      const res = await fetch(`/api/tasks?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.tasks || [])
      }
    } catch {
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    setShowSearchResults(true)
    setSearchLoading(true)
    debounceRef.current = setTimeout(() => doSearch(searchQuery), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery, doSearch])

  // Close search results on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        navigateToTask(searchResults[selectedIndex].id)
      } else if (searchQuery.trim()) {
        // Navigate to tasks page with search
        router.push(`/tasks?search=${encodeURIComponent(searchQuery)}`)
        setShowSearchResults(false)
        setSearchQuery('')
      }
    } else if (e.key === 'Escape') {
      setShowSearchResults(false)
    }
  }

  const navigateToTask = (taskId: number) => {
    router.push(`/tasks?taskId=${taskId}`)
    setShowSearchResults(false)
    setSearchQuery('')
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    if (onLogout) {
      onLogout()
    } else {
      router.push('/login')
    }
  }

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30 transition-all duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Search */}
        <div ref={searchRef} className="relative group">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors duration-200 group-focus-within:text-primary-500 z-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSelectedIndex(-1) }}
            onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder="ค้นหางาน... (Enter เพื่อดูทั้งหมด)"
            className="pl-10 pr-10 py-2 w-44 sm:w-64 bg-gray-50/80 border border-gray-200/60 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white sm:focus:w-80 focus:shadow-lg focus:shadow-primary-500/5 placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchResults(false) }}
              title="ล้างคำค้นหา"
              aria-label="ล้างคำค้นหา"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-[28rem] max-w-[28rem] bg-white/95 backdrop-blur-xl rounded-xl shadow-elevated border border-gray-200/60 overflow-hidden z-50 animate-fade-in-down">
              {searchLoading ? (
                <div className="px-4 py-6 text-center">
                  <div className="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500 mt-2">กำลังค้นหา...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50/80 border-b border-gray-100">
                    พบ {searchResults.length} ผลลัพธ์
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.map((task, idx) => (
                      <button
                        key={task.id}
                        onClick={() => navigateToTask(task.id)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          'w-full px-4 py-3 text-left flex items-center gap-3 transition-colors duration-150',
                          idx === selectedIndex ? 'bg-primary-50' : 'hover:bg-gray-50'
                        )}
                      >
                        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', priorityColors[task.priority]?.replace('text-', 'bg-') || 'bg-gray-300')} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{task.title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {task.strategy && <span className="text-xs text-gray-400">{task.strategy.code}</span>}
                            {task.tactic && <span className="text-xs text-gray-400">› {task.tactic.code}</span>}
                          </div>
                        </div>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', statusColors[task.status] || 'bg-gray-100 text-gray-600')}>
                          {statusLabels[task.status] || task.status}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      router.push(`/tasks?search=${encodeURIComponent(searchQuery)}`)
                      setShowSearchResults(false)
                      setSearchQuery('')
                    }}
                    className="w-full px-4 py-2.5 text-center text-sm text-primary-600 bg-gray-50/80 border-t border-gray-100 hover:bg-primary-50 transition-colors font-medium"
                  >
                    ดูผลลัพธ์ทั้งหมดในหน้างาน →
                  </button>
                </div>
              ) : searchQuery.trim() ? (
                <div className="px-4 py-6 text-center">
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-sm text-gray-500">ไม่พบผลลัพธ์สำหรับ &quot;{searchQuery}&quot;</p>
                  <button
                    onClick={() => {
                      router.push(`/tasks?search=${encodeURIComponent(searchQuery)}`)
                      setShowSearchResults(false)
                      setSearchQuery('')
                    }}
                    className="mt-2 text-xs text-primary-500 hover:text-primary-600 transition-colors"
                  >
                    ค้นหาในหน้างาน →
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <NotificationBell />

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-1.5 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 text-white rounded-full flex items-center justify-center font-medium text-sm shadow-sm transition-transform duration-200 group-hover:scale-105">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
              <div className="text-xs text-gray-500">{roleLabels[user.role]}</div>
            </div>
            <svg className={cn('w-4 h-4 text-gray-400 transition-transform duration-300', showDropdown && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-elevated border border-gray-200/60 py-2 z-20 animate-fade-in-down">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="font-medium text-gray-900">{user.fullName}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{user.email}</div>
                  <Badge variant="info" size="sm" className="mt-2">
                    {roleLabels[user.role]}
                  </Badge>
                </div>
                {user.org && (
                  <div className="px-4 py-2.5 border-b border-gray-100 text-sm text-gray-500 flex items-center gap-2">
                    <span className="text-base">🏢</span>
                    {user.org.name}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  ออกจากระบบ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
