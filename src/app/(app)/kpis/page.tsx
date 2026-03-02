'use client'

import { useEffect, useState } from 'react'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface KPI {
  id: number
  code: string
  name: string
  unit: string
  frequency: 'monthly' | 'quarterly' | 'yearly'
  definition: string | null
  targetRuleJson: any
  tactic: {
    code: string
    name: string
    strategy: {
      code: string
      name: string
    }
  }
  values: Array<{
    id: number
    periodYYYYMM: string
    value: number
    note: string | null
    org: { id: number; name: string } | null
    createdBy: { id: number; fullName: string }
  }>
  _count: {
    taskKpis: number
  }
}

interface KPIValueModalProps {
  kpi: KPI | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

function KPIValueModal({ kpi, isOpen, onClose, onSave }: KPIValueModalProps) {
  const [period, setPeriod] = useState('')
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      setPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
      setValue('')
      setNote('')
    }
  }, [isOpen])

  if (!isOpen || !kpi) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/kpis/${kpi.id}/values`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodYYYYMM: period,
          value: parseFloat(value),
          note: note || null,
        }),
      })

      if (res.ok) {
        toast.success('บันทึกค่า KPI สำเร็จ')
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">บันทึกค่า KPI</h3>
          <p className="text-sm text-gray-500 mt-1">{kpi.code}: {kpi.name}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">งวด (เดือน/ปี)</label>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ค่าที่วัดได้ ({kpi.unit})</label>
            <input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder={`กรอกค่า ${kpi.unit}`}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">หมายเหตุ</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
            />
          </div>
          <div className="flex justify-end gap-2">
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

export default function KPIDashboardPage() {
  const [kpis, setKpis] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStrategy, setSelectedStrategy] = useState<string>('ALL')
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchKPIs = async () => {
    try {
      const res = await fetch('/api/kpis')
      if (res.ok) {
        const data = await res.json()
        setKpis(data)
      }
    } catch (error) {
      console.error('Failed to fetch KPIs:', error)
      toast.error('ไม่สามารถโหลดข้อมูล KPI ได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKPIs()
  }, [])

  const strategies = Array.from(new Set(kpis.map((k) => k.tactic.strategy.code))).sort()

  const filteredKPIs = kpis.filter((k) => {
    const matchesStrategy = selectedStrategy === 'ALL' || k.tactic.strategy.code === selectedStrategy
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch = !q || 
      k.code.toLowerCase().includes(q) ||
      k.name.toLowerCase().includes(q) ||
      k.tactic.code.toLowerCase().includes(q) ||
      k.tactic.name.toLowerCase().includes(q) ||
      (k.unit && k.unit.toLowerCase().includes(q))
    return matchesStrategy && matchesSearch
  })

  // Group KPIs by strategy
  const groupedKPIs = filteredKPIs.reduce((acc, kpi) => {
    const key = kpi.tactic.strategy.code
    if (!acc[key]) {
      acc[key] = {
        strategyCode: kpi.tactic.strategy.code,
        strategyName: kpi.tactic.strategy.name,
        kpis: [],
      }
    }
    acc[key].kpis.push(kpi)
    return acc
  }, {} as Record<string, { strategyCode: string; strategyName: string; kpis: KPI[] }>)

  const calculateProgress = (kpi: KPI) => {
    const target = kpi.targetRuleJson as any
    if (!target) return { current: 0, target: 0, percent: 0 }

    const totalValue = kpi.values.reduce((sum, v) => sum + Number(v.value), 0)
    let targetValue = 0

    if (target.yearly) targetValue = target.yearly
    else if (target.quarterly) targetValue = target.quarterly * 4
    else if (target.monthly) targetValue = target.monthly * 12
    else if (target.target) targetValue = target.target

    const percent = targetValue > 0 ? Math.min((totalValue / targetValue) * 100, 100) : 0

    return { current: totalValue, target: targetValue, percent: Math.round(percent) }
  }

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'bg-green-500'
    if (percent >= 50) return 'bg-yellow-500'
    if (percent >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const frequencyLabel: Record<string, string> = {
    monthly: 'รายเดือน',
    quarterly: 'รายไตรมาส',
    yearly: 'รายปี',
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">KPI Dashboard</h1>
          <p className="text-gray-500 mt-1">ติดตามความคืบหน้า KPI ตามยุทธศาสตร์</p>
        </div>
      </div>

      {/* Search & Strategy Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative group w-full sm:w-auto">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors duration-200 group-focus-within:text-primary-500"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา KPI ตามรหัส, ชื่อ, แผนกลยุทธ์..."
            className="w-full sm:w-72 pl-10 pr-10 py-2 bg-gray-50/80 border border-gray-200/60 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white focus:shadow-lg focus:shadow-primary-500/5 placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Strategy Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedStrategy === 'ALL' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setSelectedStrategy('ALL')}
        >
          ทั้งหมด
        </Button>
        {strategies.map((code) => (
          <Button
            key={code}
            variant={selectedStrategy === code ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedStrategy(code)}
          >
            {code}
          </Button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">KPI ทั้งหมด</p>
          <p className="text-2xl font-bold">{filteredKPIs.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">บรรลุเป้า (≥80%)</p>
          <p className="text-2xl font-bold text-green-600">
            {filteredKPIs.filter((k) => calculateProgress(k).percent >= 80).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">ใกล้บรรลุ (50-79%)</p>
          <p className="text-2xl font-bold text-yellow-600">
            {filteredKPIs.filter((k) => {
              const p = calculateProgress(k).percent
              return p >= 50 && p < 80
            }).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">ต้องเร่งดำเนินการ (&lt;50%)</p>
          <p className="text-2xl font-bold text-red-600">
            {filteredKPIs.filter((k) => calculateProgress(k).percent < 50).length}
          </p>
        </div>
      </div>

      {/* KPI Cards by Strategy */}
      {Object.values(groupedKPIs).map((group) => (
        <div key={group.strategyCode} className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {group.strategyCode}: {group.strategyName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.kpis.map((kpi) => {
              const progress = calculateProgress(kpi)
              return (
                <div key={kpi.id} className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Badge variant="gray" className="mb-2">
                        {kpi.tactic.code}
                      </Badge>
                      <h3 className="font-medium text-gray-900 text-sm">
                        {kpi.code}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{kpi.name}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">ความคืบหน้า</span>
                      <span className="font-medium">{progress.percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full transition-all', getProgressColor(progress.percent))}
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>
                        {progress.current.toLocaleString()} / {progress.target.toLocaleString()} {kpi.unit}
                      </span>
                      <span>{frequencyLabel[kpi.frequency]}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {kpi._count.taskKpis} งานที่เชื่อมโยง
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedKPI(kpi)
                        setModalOpen(true)
                      }}
                    >
                      บันทึกค่า
                    </Button>
                  </div>

                  {kpi.values.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-2">ค่าล่าสุด:</p>
                      <div className="space-y-1">
                        {kpi.values.slice(0, 3).map((v) => (
                          <div key={v.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{v.periodYYYYMM}</span>
                            <span className="font-medium">{Number(v.value).toLocaleString()} {kpi.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <KPIValueModal
        kpi={selectedKPI}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={fetchKPIs}
      />
    </div>
  )
}
