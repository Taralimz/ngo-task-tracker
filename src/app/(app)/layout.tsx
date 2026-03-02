'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { Sidebar, Header, AutoLogoutWarning } from '@/components/layout'
import { StrategyWithTactics, AuthUser } from '@/types'
import { useAutoLogout } from '@/lib/useAutoLogout'
import toast from 'react-hot-toast'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [strategies, setStrategies] = useState<StrategyWithTactics[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchStrategies()
  }, [])

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/login')
        return
      }
      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchStrategies = async () => {
    try {
      const response = await fetch('/api/strategies')
      if (response.ok) {
        const data = await response.json()
        setStrategies(data)
      }
    } catch (error) {
      console.error('Failed to fetch strategies:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('ออกจากระบบสำเร็จ')
      router.push('/login')
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  // Auto logout after 15 minutes idle, 60 second warning
  const { showWarning, remainingSeconds, stayLoggedIn, logoutNow } = useAutoLogout({
    timeoutMinutes: 15,
    warningSeconds: 60,
    onLogout: () => {
      toast('ออกจากระบบอัตโนมัติเนื่องจากไม่มีการใช้งาน', { icon: '🕐' })
      router.push('/login?reason=timeout')
    },
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center animate-fade-in">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-primary-100" />
            <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-primary-300 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
          </div>
          <p className="text-gray-500 font-medium animate-pulse">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50/80 flex">
      <Sidebar
        strategies={strategies}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={user}
          onLogout={handleLogout}
          onMenuToggle={() => setMobileSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 p-4 sm:p-6 overflow-auto scrollbar-thin">
          <div className="page-enter">
            {children}
          </div>
        </main>
      </div>
      <AutoLogoutWarning
        show={showWarning}
        remainingSeconds={remainingSeconds}
        onStay={stayLoggedIn}
        onLogout={logoutNow}
      />
    </div>
  )
}
