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

interface TeamMember {
  id: number
  userId: number
  role: string
  user: User
}

interface Team {
  id: number
  name: string
  description: string | null
  color: string
  isDefault: boolean
  active: boolean
  createdAt: string
  members: TeamMember[]
  _count: {
    members: number
    taskAssignments: number
  }
}

const COLORS = [
  { value: '#3B82F6', label: 'น้ำเงิน' },
  { value: '#10B981', label: 'เขียว' },
  { value: '#F59E0B', label: 'ส้ม' },
  { value: '#EF4444', label: 'แดง' },
  { value: '#8B5CF6', label: 'ม่วง' },
  { value: '#EC4899', label: 'ชมพู' },
  { value: '#06B6D4', label: 'ฟ้า' },
  { value: '#6B7280', label: 'เทา' },
]

interface TeamModalProps {
  team: Team | null
  users: User[]
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

function TeamModal({ team, users, isOpen, onClose, onSave }: TeamModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    isDefault: false,
    memberIds: [] as number[],
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description || '',
        color: team.color,
        isDefault: team.isDefault,
        memberIds: team.members?.map(m => m.userId) || [],
      })
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3B82F6',
        isDefault: false,
        memberIds: [],
      })
    }
  }, [team, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = team ? `/api/teams/${team.id}` : '/api/teams'
      const method = team ? 'PATCH' : 'POST'

      // First create/update the team
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          color: formData.color,
          isDefault: formData.isDefault,
          ...(team ? {} : { memberIds: formData.memberIds }),
        }),
      })

      if (res.ok) {
        // If editing, update members separately
        if (team) {
          await fetch(`/api/teams/${team.id}/members`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memberIds: formData.memberIds }),
          })
        }
        
        toast.success(team ? 'อัปเดตทีมสำเร็จ' : 'สร้างทีมสำเร็จ')
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

  const toggleMember = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter(id => id !== userId)
        : [...prev.memberIds, userId]
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">
            {team ? 'แก้ไขทีม' : 'สร้างทีมใหม่'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ชื่อทีม *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="เช่น ทีมสื่อสาร, ทีมวิจัย"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">รายละเอียด</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                rows={2}
                placeholder="อธิบายเกี่ยวกับทีมนี้"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">สีของทีม</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c.value })}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      formData.color === c.value ? 'border-gray-900 scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">ทีมเริ่มต้น (ผู้ใช้ใหม่จะถูกเพิ่มเข้าทีมนี้อัตโนมัติ)</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                สมาชิกทีม ({formData.memberIds.length} คน)
              </label>
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {users.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">ไม่มีผู้ใช้</div>
                ) : (
                  users.map((user) => (
                    <label
                      key={user.id}
                      className={cn(
                        'flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0',
                        formData.memberIds.includes(user.id) && 'bg-primary-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={formData.memberIds.includes(user.id)}
                        onChange={() => toggleMember(user.id)}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.fullName}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                      {formData.memberIds[0] === user.id && (
                        <Badge className="bg-yellow-100 text-yellow-800">Leader</Badge>
                      )}
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                * ผู้ใช้คนแรกที่เลือกจะเป็น Team Leader
              </p>
            </div>
          </div>
        </form>
        <div className="p-4 border-t flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'กำลังบันทึก...' : team ? 'อัปเดต' : 'สร้างทีม'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Team | null>(null)

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams?includeMembers=true')
      const data = await res.json()
      setTeams(data)
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลทีมได้')
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

  useEffect(() => {
    fetchTeams()
    fetchUsers()
  }, [])

  const handleDelete = async (team: Team) => {
    try {
      const res = await fetch(`/api/teams/${team.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('ลบทีมสำเร็จ')
        fetchTeams()
      } else {
        const data = await res.json()
        toast.error(data.error || 'เกิดข้อผิดพลาด')
      }
    } catch {
      toast.error('เกิดข้อผิดพลาด')
    }
    setConfirmDelete(null)
  }

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(search.toLowerCase()) ||
    team.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold animate-fade-in-up tracking-tight">จัดการทีม</h1>
          <p className="text-gray-500 mt-1 animate-fade-in-up" style={{ animationDelay: '50ms' }}>สร้างและจัดการทีมงานสำหรับมอบหมายงาน</p>
        </div>
        <Button className="btn-shine" onClick={() => { setSelectedTeam(null); setModalOpen(true) }}>
          + สร้างทีมใหม่
        </Button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 ค้นหาทีม..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 hover:border-gray-400 transition-all duration-200 ease-smooth bg-white/80 backdrop-blur-sm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden animate-pulse">
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-lg w-full" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-3 bg-gray-100 rounded-lg w-20" />
                  <div className="h-3 bg-gray-100 rounded-lg w-16" />
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50/50 border-t flex justify-end gap-2">
                <div className="h-8 bg-gray-200 rounded-lg w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden card-hover transition-all duration-300"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{team.name}</h3>
                      {team.isDefault && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Default</Badge>
                      )}
                    </div>
                    {team.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">{team.description}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                  <span>👥 {team._count.members} สมาชิก</span>
                  <span>📋 {team._count.taskAssignments} งาน</span>
                </div>

                {team.members && team.members.length > 0 && (
                  <div className="mt-3 flex -space-x-2">
                    {team.members.slice(0, 5).map((member) => (
                      <div
                        key={member.id}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 border-2 border-white flex items-center justify-center text-xs font-medium text-white shadow-sm hover:scale-110 hover:z-10 transition-transform duration-200"
                        title={member.user.fullName}
                      >
                        {member.user.fullName.charAt(0)}
                      </div>
                    ))}
                    {team.members.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600 hover:scale-110 transition-transform duration-200">
                        +{team.members.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="px-4 py-3 bg-gray-50/50 border-t flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSelectedTeam(team); setModalOpen(true) }}
                >
                  แก้ไข
                </Button>
                {!team.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setConfirmDelete(team)}
                  >
                    ลบ
                  </Button>
                )}
              </div>
            </div>
          ))}

          {filteredTeams.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 animate-fade-in-up">
              {search ? 'ไม่พบทีมที่ค้นหา' : 'ยังไม่มีทีม กดปุ่ม "สร้างทีมใหม่" เพื่อเริ่มต้น'}
            </div>
          )}
        </div>
      )}

      <TeamModal
        team={selectedTeam}
        users={users}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={fetchTeams}
      />

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-overlay">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-elevated w-full max-w-sm mx-4 p-6 animate-fade-in-scale">
            <h3 className="text-lg font-semibold mb-2">ยืนยันการลบทีม</h3>
            <p className="text-gray-600 mb-4">
              คุณต้องการลบทีม &quot;{confirmDelete.name}&quot; หรือไม่?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                ยกเลิก
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleDelete(confirmDelete)}
              >
                ลบทีม
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
