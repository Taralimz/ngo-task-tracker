'use client'

import { useEffect, useState } from 'react'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface User {
  id: number
  email: string
  fullName: string
  role: 'superadmin' | 'admin' | 'admin_zone' | 'user_org'
  orgId: number | null
  active: boolean
  createdAt: string
  org: { id: number; name: string } | null
  _count: {
    taskAssignments: number
  }
}

interface Org {
  id: number
  name: string
  _count: { users: number }
}

const roleLabels: Record<string, string> = {
  superadmin: 'ผู้ดูแลระบบหลัก',
  admin: 'ผู้ดูแลระบบ',
  admin_zone: 'หัวหน้าสำนัก',
  user_org: 'เจ้าหน้าที่',
}

const roleColors: Record<string, string> = {
  superadmin: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  admin_zone: 'bg-green-100 text-green-800',
  user_org: 'bg-gray-100 text-gray-800',
}

interface UserModalProps {
  user: User | null
  orgs: Org[]
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

function UserModal({ user, orgs, isOpen, onClose, onSave }: UserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user_org',
    orgId: '',
    active: true,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '',
        fullName: user.fullName,
        role: user.role,
        orgId: user.orgId?.toString() || '',
        active: user.active,
      })
    } else {
      setFormData({
        email: '',
        password: '',
        fullName: '',
        role: 'user_org',
        orgId: '',
        active: true,
      })
    }
  }, [user, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = user ? `/api/users/${user.id}` : '/api/users'
      const method = user ? 'PATCH' : 'POST'

      const body: any = {
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role,
        orgId: formData.orgId ? parseInt(formData.orgId) : null,
        active: formData.active,
      }

      if (formData.password) {
        body.password = formData.password
      }

      if (!user && !formData.password) {
        toast.error('กรุณากรอกรหัสผ่าน')
        setLoading(false)
        return
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(user ? 'อัปเดตผู้ใช้สำเร็จ' : 'เพิ่มผู้ใช้สำเร็จ')
        onSave()
        onClose()
      } else {
        const data = await res.json()
        toast.error(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold">
            {user ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ชื่อ-นามสกุล *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">อีเมล *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              รหัสผ่าน {user ? '(เว้นว่างถ้าไม่ต้องการเปลี่ยน)' : '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              required={!user}
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">บทบาท</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">สำนัก/ฝ่าย</label>
            <select
              value={formData.orgId}
              onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- ไม่ระบุ --</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="active" className="text-sm">
                เปิดใช้งาน
              </label>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [orgFilter, setOrgFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      if (orgFilter) params.set('orgId', orgFilter)
      if (showInactive) params.set('active', 'false')

      const [usersRes, orgsRes] = await Promise.all([
        fetch(`/api/users?${params.toString()}`),
        fetch('/api/orgs'),
      ])

      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data)
      }

      if (orgsRes.ok) {
        const data = await orgsRes.json()
        setOrgs(data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [search, roleFilter, orgFilter, showInactive])

  const handleDelete = async (user: User) => {
    if (!confirm(`ต้องการปิดการใช้งาน ${user.fullName} หรือไม่?`)) return

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('ปิดการใช้งานสำเร็จ')
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">จัดการผู้ใช้งาน</h1>
          <p className="text-gray-500 mt-1">เพิ่ม แก้ไข และจัดการผู้ใช้งานในระบบ</p>
        </div>
        <Button onClick={() => { setSelectedUser(null); setModalOpen(true); }} className="btn-shine">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มผู้ใช้
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">ค้นหา</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="ชื่อหรืออีเมล..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">บทบาท</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">ทั้งหมด</option>
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">สำนัก/ฝ่าย</label>
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">ทั้งหมด</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">แสดงผู้ใช้ที่ปิดการใช้งาน</span>
            </label>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ชื่อ</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">อีเมล</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">บทบาท</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">สำนัก/ฝ่าย</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">งาน</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">สถานะ</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className={cn(!user.active && 'bg-gray-50 opacity-60')}>
                <td className="px-4 py-3">
                  <span className="font-medium">{user.fullName}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge className={roleColors[user.role]}>
                    {roleLabels[user.role]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {user.org?.name || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {user._count.taskAssignments} งาน
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.active ? 'success' : 'gray'}>
                    {user.active ? 'ใช้งาน' : 'ปิดการใช้งาน'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => { setSelectedUser(user); setModalOpen(true); }}
                      className="p-1 text-gray-500 hover:text-primary-600"
                      title="แก้ไข"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {user.active && (
                      <button
                        onClick={() => handleDelete(user)}
                        className="p-1 text-gray-500 hover:text-red-600"
                        title="ปิดการใช้งาน"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            ไม่พบผู้ใช้งาน
          </div>
        )}
      </div>

      <UserModal
        user={selectedUser}
        orgs={orgs}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={fetchData}
      />
    </div>
  )
}
