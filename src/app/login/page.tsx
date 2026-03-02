'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button, Input } from '@/components/ui'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Show timeout message if redirected from auto logout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('reason') === 'timeout') {
      toast('เซสชันหมดอายุเนื่องจากไม่มีการใช้งาน กรุณาเข้าสู่ระบบอีกครั้ง', {
        icon: '🔒',
        duration: 5000,
      })
      // Clean up URL
      window.history.replaceState({}, '', '/login')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ')
      }

      toast.success('เข้าสู่ระบบสำเร็จ')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary-100/20 to-blue-100/20 rounded-full blur-3xl" />
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-elevated border border-white/60 relative z-10">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4">
            <Image src="/RSAT LOGO SQUARE.png" alt="RSAT Logo" width={80} height={80} className="w-20 h-20 rounded-2xl" priority />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">RSAT Task Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">สมาคมฟ้าสีรุ้งแห่งประเทศไทย</p>
          <p className="text-xs text-gray-400 mt-0.5">Rainbow Sky Association of Thailand</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Input
              type="email"
              label="อีเมล"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <Input
              type="password"
              label="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <Button type="submit" loading={loading} className="w-full h-11">
              เข้าสู่ระบบ
            </Button>
          </div>
        </form>

        {/* Demo Accounts */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-3 text-center">
            บัญชีทดสอบ (รหัสผ่าน: password123)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setEmail('superadmin@rsat.org')
                setPassword('password123')
              }}
              className="p-2.5 bg-gray-50/80 rounded-xl hover:bg-gray-100 border border-transparent hover:border-gray-200"
            >
              <div className="font-medium text-gray-800">Super Admin</div>
              <div className="text-gray-500 mt-0.5">superadmin@rsat.org</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@rsat.org')
                setPassword('password123')
              }}
              className="p-2.5 bg-gray-50/80 rounded-xl hover:bg-gray-100 border border-transparent hover:border-gray-200"
            >
              <div className="font-medium text-gray-800">Admin</div>
              <div className="text-gray-500 mt-0.5">admin@rsat.org</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('zone.admin@rsat.org')
                setPassword('password123')
              }}
              className="p-2.5 bg-gray-50/80 rounded-xl hover:bg-gray-100 border border-transparent hover:border-gray-200"
            >
              <div className="font-medium text-gray-800">Zone Admin</div>
              <div className="text-gray-500 mt-0.5">zone.admin@rsat.org</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('user@rsat.org')
                setPassword('password123')
              }}
              className="p-2.5 bg-gray-50/80 rounded-xl hover:bg-gray-100 border border-transparent hover:border-gray-200"
            >
              <div className="font-medium text-gray-800">User</div>
              <div className="text-gray-500 mt-0.5">user@rsat.org</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
