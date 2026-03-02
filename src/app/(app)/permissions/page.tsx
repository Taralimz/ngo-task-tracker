'use client'

import { useEffect, useState } from 'react'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface User {
  id: number
  fullName: string
  email: string
  role: string
}

interface PermissionGroupUser {
  id: number
  userId: number
  user: User
}

interface PermissionGroup {
  id: number
  name: string
  description: string | null
  permissions: string[]
  isSystem: boolean
  active: boolean
  createdAt: string
  users: PermissionGroupUser[]
  _count: {
    users: number
  }
}

interface PermissionCategories {
  permissions: Record<string, string>
  categories: Record<string, string[]>
}

interface PermGroupModalProps {
  group: PermissionGroup | null
  users: User[]
  permData: PermissionCategories | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

function PermGroupModal({ group, users, permData, isOpen, onClose, onSave }: PermGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    userIds: [] as number[],
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'permissions' | 'users'>('permissions')

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description || '',
        permissions: group.permissions || [],
        userIds: group.users?.map(u => u.userId) || [],
      })
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: [],
        userIds: [],
      })
    }
  }, [group, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = group ? `/api/permission-groups/${group.id}` : '/api/permission-groups'
      const method = group ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          permissions: formData.permissions,
          ...(group ? {} : { userIds: formData.userIds }),
        }),
      })

      if (res.ok) {
        // If editing, update users separately
        if (group) {
          await fetch(`/api/permission-groups/${group.id}/users`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: formData.userIds }),
          })
        }

        toast.success(group ? 'อัปเดตกลุ่มสิทธิ์สำเร็จ' : 'สร้างกลุ่มสิทธิ์สำเร็จ')
        onSave()
        onClose()
      } else {
        const data = await res.json()
        toast.error(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (perm: string) => {
    if (group?.isSystem) return
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }))
  }

  const toggleUser = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter(id => id !== userId)
        : [...prev.userIds, userId]
    }))
  }

  const toggleCategoryAll = (categoryPerms: string[]) => {
    if (group?.isSystem) return
    const allSelected = categoryPerms.every(p => formData.permissions.includes(p))
    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(p => !categoryPerms.includes(p))
        : [...new Set([...prev.permissions, ...categoryPerms])]
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">
            {group ? 'แก้ไขกลุ่มสิทธิ์' : 'สร้างกลุ่มสิทธิ์ใหม่'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">ชื่อกลุ่มสิทธิ์ *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="เช่น ผู้จัดการโครงการ"
                  required
                  disabled={group?.isSystem}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">รายละเอียด</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="อธิบายเกี่ยวกับกลุ่มสิทธิ์นี้"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                type="button"
                onClick={() => setActiveTab('permissions')}
                className={cn(
                  'px-4 py-2 font-medium border-b-2 -mb-px',
                  activeTab === 'permissions'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                สิทธิ์ ({formData.permissions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={cn(
                  'px-4 py-2 font-medium border-b-2 -mb-px',
                  activeTab === 'users'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                ผู้ใช้ ({formData.userIds.length})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'permissions' ? (
              <div className="space-y-4">
                {permData && Object.entries(permData.categories).map(([category, perms]) => (
                  <div key={category} className="border rounded-lg overflow-hidden">
                    <div
                      className="bg-gray-50 px-4 py-2 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleCategoryAll(perms)}
                    >
                      <span className="font-medium">{category}</span>
                      <input
                        type="checkbox"
                        checked={perms.every(p => formData.permissions.includes(p))}
                        onChange={() => toggleCategoryAll(perms)}
                        className="rounded"
                        disabled={group?.isSystem}
                      />
                    </div>
                    <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                      {perms.map((perm) => (
                        <label
                          key={perm}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50',
                            formData.permissions.includes(perm) && 'bg-primary-50',
                            group?.isSystem && 'opacity-60 cursor-not-allowed'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(perm)}
                            onChange={() => togglePermission(perm)}
                            className="rounded"
                            disabled={group?.isSystem}
                          />
                          <span className="text-sm">{permData.permissions[perm]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-lg max-h-80 overflow-y-auto">
                {users.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">ไม่มีผู้ใช้</div>
                ) : (
                  users.map((user) => (
                    <label
                      key={user.id}
                      className={cn(
                        'flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0',
                        formData.userIds.includes(user.id) && 'bg-primary-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={formData.userIds.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.fullName}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : group ? 'อัปเดต' : 'สร้างกลุ่มสิทธิ์'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PermissionGroupsPage() {
  const [groups, setGroups] = useState<PermissionGroup[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [permData, setPermData] = useState<PermissionCategories | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<PermissionGroup | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<PermissionGroup | null>(null)

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/permission-groups?includeUsers=true')
      const data = await res.json()
      setGroups(data)
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลกลุ่มสิทธิ์ได้')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(data)
    } catch {
      console.error('Error fetching users')
    }
  }

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/permission-groups/permissions')
      const data = await res.json()
      setPermData(data)
    } catch {
      console.error('Error fetching permissions')
    }
  }

  useEffect(() => {
    fetchGroups()
    fetchUsers()
    fetchPermissions()
  }, [])

  const handleDelete = async (group: PermissionGroup) => {
    try {
      const res = await fetch(`/api/permission-groups/${group.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('ลบกลุ่มสิทธิ์สำเร็จ')
        fetchGroups()
      } else {
        const data = await res.json()
        toast.error(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch {
      toast.error('เกิดข้อผิดพลาด')
    }
    setConfirmDelete(null)
  }

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(search.toLowerCase()) ||
    group.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold animate-fade-in-up tracking-tight">จัดการกลุ่มสิทธิ์</h1>
          <p className="text-gray-500 mt-1 animate-fade-in-up" style={{ animationDelay: '50ms' }}>กำหนดสิทธิ์การเข้าถึงระบบตามกลุ่มผู้ใช้</p>
        </div>
        <Button className="btn-shine" onClick={() => { setSelectedGroup(null); setModalOpen(true) }}>
          + สร้างกลุ่มสิทธิ์ใหม่
        </Button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 ค้นหากลุ่มสิทธิ์..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-gray-400 transition-all duration-200 ease-smooth bg-white/80 backdrop-blur-sm"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ชื่อกลุ่มสิทธิ์</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">รายละเอียด</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">จำนวนสิทธิ์</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">ผู้ใช้</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">สถานะ</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded-lg w-32" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded-lg w-48" /></td>
                  <td className="px-4 py-3"><div className="h-5 bg-gray-100 rounded-lg w-16 mx-auto" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-gray-100 rounded-lg w-12 mx-auto" /></td>
                  <td className="px-4 py-3"><div className="h-5 bg-gray-100 rounded-lg w-16 mx-auto" /></td>
                  <td className="px-4 py-3"><div className="h-8 bg-gray-100 rounded-lg w-20 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden animate-fade-in-up">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ชื่อกลุ่มสิทธิ์</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">รายละเอียด</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">จำนวนสิทธิ์</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">ผู้ใช้</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">สถานะ</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredGroups.map((group) => (
                <tr key={group.id} className="hover:bg-primary-50/30 transition-colors duration-200">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{group.name}</span>
                      {group.isSystem && (
                        <Badge className="bg-gray-100 text-gray-600 text-xs">ระบบ</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {group.description || '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge className="bg-blue-100 text-blue-800">
                      {group.permissions?.length || 0} สิทธิ์
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm">{group._count.users} คน</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {group.active ? (
                      <Badge className="bg-green-100 text-green-800">ใช้งาน</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">ปิดใช้งาน</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setSelectedGroup(group); setModalOpen(true) }}
                      >
                        แก้ไข
                      </Button>
                      {!group.isSystem && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => setConfirmDelete(group)}
                        >
                          ลบ
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredGroups.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 animate-fade-in-up">
                    {search ? 'ไม่พบกลุ่มสิทธิ์ที่ค้นหา' : 'ยังไม่มีกลุ่มสิทธิ์'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <PermGroupModal
        group={selectedGroup}
        users={users}
        permData={permData}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={fetchGroups}
      />

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-overlay">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-elevated w-full max-w-sm mx-4 p-6 animate-fade-in-scale">
            <h3 className="text-lg font-semibold mb-2">ยืนยันการลบกลุ่มสิทธิ์</h3>
            <p className="text-gray-600 mb-4">
              คุณต้องการลบกลุ่มสิทธิ์ &quot;{confirmDelete.name}&quot; หรือไม่?
              ผู้ใช้ในกลุ่มนี้จะถูกนำออกทั้งหมด
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                ยกเลิก
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleDelete(confirmDelete)}
              >
                ลบกลุ่มสิทธิ์
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
