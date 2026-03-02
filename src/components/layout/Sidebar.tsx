'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { StrategyWithTactics } from '@/types'

interface SidebarProps {
  strategies: StrategyWithTactics[]
  mobileOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ strategies, mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedStrategies, setExpandedStrategies] = useState<number[]>([])
  const [expandedTactics, setExpandedTactics] = useState<number[]>([])

  // Auto-expand based on current path
  useEffect(() => {
    const match = pathname.match(/\/tactics\/(\d+)/)
    if (match) {
      const tacticId = parseInt(match[1])
      strategies.forEach((strategy) => {
        const tactic = strategy.tactics.find((t) => t.id === tacticId)
        if (tactic) {
          setExpandedStrategies((prev) => [...new Set([...prev, strategy.id])])
          setExpandedTactics((prev) => [...new Set([...prev, tactic.id])])
        }
      })
    }
  }, [pathname, strategies])

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

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-r border-gray-200/60 h-screen overflow-y-auto scrollbar-thin transition-transform duration-300 lg:relative lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-200/60 flex items-start justify-between gap-2">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
            <Image src="/RSAT LOGO SQUARE.png" alt="RSAT" width={40} height={40} className="w-10 h-10 rounded-lg" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-gray-900 tracking-tight text-sm block leading-tight">RSAT Task Tracker</span>
            <span className="text-[10px] text-gray-400 leading-tight">สมาคมฟ้าสีรุ้งแห่งประเทศไทย</span>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3">
        <div className="mb-4 space-y-0.5">
          <Link
            href="/dashboard"
            className={cn(
              'nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              pathname === '/dashboard'
                ? 'active bg-primary-50 text-primary-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <svg className={cn('w-5 h-5 transition-transform duration-200', pathname === '/dashboard' && 'scale-110')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            แดชบอร์ด
          </Link>
          <Link
            href="/tasks"
            className={cn(
              'nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              pathname === '/tasks'
                ? 'active bg-primary-50 text-primary-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <svg className={cn('w-5 h-5 transition-transform duration-200', pathname === '/tasks' && 'scale-110')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            งานทั้งหมด
          </Link>
          <Link
            href="/kpis"
            className={cn(
              'nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              pathname === '/kpis'
                ? 'active bg-primary-50 text-primary-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <svg className={cn('w-5 h-5 transition-transform duration-200', pathname === '/kpis' && 'scale-110')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            KPI Dashboard
          </Link>
          <Link
            href="/strategies"
            className={cn(
              'nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              pathname === '/strategies'
                ? 'active bg-primary-50 text-primary-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <svg className={cn('w-5 h-5 transition-transform duration-200', pathname === '/strategies' && 'scale-110')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            ยุทธศาสตร์
          </Link>
          <Link
            href="/reports"
            className={cn(
              'nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              pathname === '/reports'
                ? 'active bg-primary-50 text-primary-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <svg className={cn('w-5 h-5 transition-transform duration-200', pathname === '/reports' && 'scale-110')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            รายงาน
          </Link>
          <Link
            href="/users"
            className={cn(
              'nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              pathname === '/users'
                ? 'active bg-primary-50 text-primary-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <svg className={cn('w-5 h-5 transition-transform duration-200', pathname === '/users' && 'scale-110')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            จัดการผู้ใช้
          </Link>
          <Link
            href="/teams"
            className={cn(
              'nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              pathname === '/teams'
                ? 'active bg-primary-50 text-primary-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <svg className={cn('w-5 h-5 transition-transform duration-200', pathname === '/teams' && 'scale-110')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            จัดการทีม
          </Link>
          <Link
            href="/permissions"
            className={cn(
              'nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              pathname === '/permissions'
                ? 'active bg-primary-50 text-primary-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <svg className={cn('w-5 h-5 transition-transform duration-200', pathname === '/permissions' && 'scale-110')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            กลุ่มสิทธิ์
          </Link>
        </div>

        {/* Strategic Tree */}
        <div className="mb-2 px-3 pt-2">
          <div className="divider-gradient mb-3" />
          <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            Strategic Framework
          </h3>
        </div>

        <div className="space-y-0.5">
          {strategies.map((strategy) => (
            <div key={strategy.id}>
              {/* Strategy */}
              <button
                onClick={() => toggleStrategy(strategy.id)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group',
                  expandedStrategies.includes(strategy.id)
                    ? 'bg-primary-50/60 hover:bg-primary-50'
                    : 'hover:bg-gray-50'
                )}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className={cn(
                      'w-4 h-4 flex-shrink-0 transition-transform duration-300 ease-spring text-gray-400',
                      expandedStrategies.includes(strategy.id) && 'rotate-90 text-primary-500'
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-semibold text-gray-800 flex-shrink-0">
                    {strategy.code}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0 bg-gray-100 px-1.5 py-0.5 rounded-full group-hover:bg-gray-200/60 transition-colors">
                    {strategy.tactics.length}
                  </span>
                </div>
                <p className="mt-0.5 ml-6 text-xs text-gray-500 leading-relaxed line-clamp-2" title={strategy.name}>
                  {strategy.name}
                </p>
                {strategy.description && expandedStrategies.includes(strategy.id) && (
                  <p className="mt-1 ml-6 text-[11px] text-gray-400 leading-relaxed line-clamp-2 animate-fade-in-up">
                    {strategy.description}
                  </p>
                )}
              </button>

              {/* Tactics */}
              {expandedStrategies.includes(strategy.id) && (
                <div className="ml-3 mt-1 space-y-0.5 animate-fade-in-up border-l-2 border-gray-100">
                  {strategy.tactics.map((tactic) => (
                    <div key={tactic.id}>
                      <button
                        onClick={() => toggleTactic(tactic.id)}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 group/tactic',
                          pathname.includes(`/tactics/${tactic.id}`)
                            ? 'bg-primary-50 text-primary-700 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className={cn(
                              'w-3 h-3 flex-shrink-0 transition-transform duration-300 ease-spring',
                              expandedTactics.includes(tactic.id) && 'rotate-90 text-primary-500'
                            )}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="font-medium flex-shrink-0">{tactic.code}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {tactic.kpis.length} KPIs
                          </span>
                        </div>
                        <p className="mt-0.5 ml-5 text-[11px] text-gray-400 leading-relaxed line-clamp-2" title={tactic.name}>
                          {tactic.name}
                        </p>
                      </button>

                      {/* Tactic details: description + KPIs + Tasks link */}
                      {expandedTactics.includes(tactic.id) && (
                        <div className="ml-5 mt-1 space-y-1 animate-fade-in-up">
                          {/* Tactic description */}
                          {tactic.description && (
                            <p className="px-3 py-1.5 text-[11px] text-gray-400 leading-relaxed bg-gray-50/50 rounded-lg line-clamp-3">
                              {tactic.description}
                            </p>
                          )}
                          {/* Tasks link */}
                          <Link
                            href={`/tactics/${tactic.id}/tasks`}
                            className={cn(
                              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200',
                              pathname === `/tactics/${tactic.id}/tasks`
                                ? 'bg-primary-100 text-primary-700 font-medium shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            )}
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            ดูงานทั้งหมด
                          </Link>
                          {/* KPI list */}
                          {tactic.kpis.slice(0, 4).map((kpi) => (
                            <div
                              key={kpi.id}
                              className="flex items-start gap-2 px-3 py-1 text-xs text-gray-400 group/kpi"
                              title={kpi.name}
                            >
                              <svg className="w-3 h-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <div className="min-w-0">
                                <span className="font-medium text-gray-500">{kpi.code}</span>
                                <span className="text-gray-400 ml-1 line-clamp-1">{kpi.name}</span>
                              </div>
                            </div>
                          ))}
                          {tactic.kpis.length > 4 && (
                            <div className="px-3 py-1 text-[11px] text-gray-400">
                              +{tactic.kpis.length - 4} KPI เพิ่มเติม
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
      </aside>
    </>
  )
}
