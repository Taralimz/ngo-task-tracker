'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, Input, Textarea, Select, Badge } from '@/components/ui'
import { StrategyWithTactics, TacticWithKPIs, TaskPriority, ContributionType } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  strategies: StrategyWithTactics[]
  initialTacticId?: number
  onSuccess?: () => void
}

interface KPILink {
  kpiId: number
  kpiCode: string
  kpiName: string
  contributionType: ContributionType
  expectedContributionNote: string
}

export function CreateTaskModal({
  isOpen,
  onClose,
  strategies,
  initialTacticId,
  onSuccess,
}: CreateTaskModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [strategyId, setStrategyId] = useState<number | null>(null)
  const [tacticId, setTacticId] = useState<number | null>(null)
  const [selectedKPIs, setSelectedKPIs] = useState<KPILink[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('NORMAL')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assigneeIds, setAssigneeIds] = useState<number[]>([])
  const [orgId, setOrgId] = useState<number | null>(null)
  const [orgs, setOrgs] = useState<Array<{ id: number; name: string; zone: string | null }>>([])
  const [teamIds, setTeamIds] = useState<number[]>([])
  const [teams, setTeams] = useState<Array<{ id: number; name: string; color: string; _count: { members: number } }>>([])

  // Derived state
  const selectedStrategy = strategies.find((s) => s.id === strategyId)
  const selectedTactic = selectedStrategy?.tactics.find((t) => t.id === tacticId)
  const availableKPIs = selectedTactic?.kpis || []

  // Auto-select if initialTacticId is provided
  useEffect(() => {
    if (initialTacticId && strategies.length > 0) {
      for (const strategy of strategies) {
        const tactic = strategy.tactics.find((t) => t.id === initialTacticId)
        if (tactic) {
          setStrategyId(strategy.id)
          setTacticId(tactic.id)
          setStep(3) // Jump to KPI selection
          break
        }
      }
    }
  }, [initialTacticId, strategies])

  // Fetch orgs and teams when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/orgs')
        .then((res) => res.json())
        .then((data) => setOrgs(data))
        .catch(() => {})
      fetch('/api/teams')
        .then((res) => res.json())
        .then((data) => setTeams(data))
        .catch(() => {})
    }
  }, [isOpen])

  const resetForm = () => {
    setStep(1)
    setStrategyId(null)
    setTacticId(null)
    setSelectedKPIs([])
    setTitle('')
    setDescription('')
    setPriority('NORMAL')
    setStartDate('')
    setDueDate('')
    setAssigneeIds([])
    setOrgId(null)
    setTeamIds([])
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleStrategySelect = (id: number) => {
    setStrategyId(id)
    setTacticId(null)
    setSelectedKPIs([])
    setStep(2)
  }

  const handleTacticSelect = (id: number) => {
    setTacticId(id)
    setSelectedKPIs([])
    setStep(3)
  }

  const toggleKPI = (kpi: { id: number; code: string; name: string }) => {
    const exists = selectedKPIs.find((k) => k.kpiId === kpi.id)
    if (exists) {
      setSelectedKPIs(selectedKPIs.filter((k) => k.kpiId !== kpi.id))
    } else {
      setSelectedKPIs([
        ...selectedKPIs,
        {
          kpiId: kpi.id,
          kpiCode: kpi.code,
          kpiName: kpi.name,
          contributionType: 'DIRECT',
          expectedContributionNote: '',
        },
      ])
    }
  }

  const updateKPILink = (kpiId: number, field: keyof KPILink, value: string) => {
    setSelectedKPIs(
      selectedKPIs.map((k) =>
        k.kpiId === kpiId ? { ...k, [field]: value } : k
      )
    )
  }

  const handleSubmit = async () => {
    if (!strategyId || !tacticId || selectedKPIs.length === 0 || !title.trim()) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId,
          tacticId,
          orgId: orgId || undefined,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          startDate: startDate || undefined,
          dueDate: dueDate || undefined,
          assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
          teamIds: teamIds.length > 0 ? teamIds : undefined,
          kpiLinks: selectedKPIs.map((k) => ({
            kpiId: k.kpiId,
            contributionType: k.contributionType,
            expectedContributionNote: k.expectedContributionNote || undefined,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'เกิดข้อผิดพลาด')
      }

      toast.success('สร้างงานสำเร็จ')
      handleClose()
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const canProceedToStep4 = selectedKPIs.length > 0

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="สร้างงานใหม่" size="lg">
      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
              )}
            >
              {s}
            </div>
            {s < 4 && (
              <div
                className={cn(
                  'w-8 h-0.5 mx-1',
                  step > s ? 'bg-primary-600' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
        <div className="ml-4 text-sm text-gray-500">
          {step === 1 && 'เลือกยุทธศาสตร์'}
          {step === 2 && 'เลือกแผนกลยุทธ์'}
          {step === 3 && 'เลือก KPI'}
          {step === 4 && 'รายละเอียดงาน'}
        </div>
      </div>

      {/* Step 1: Select Strategy */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">เลือกยุทธศาสตร์ที่งานนี้จะสนับสนุน</p>
          {strategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => handleStrategySelect(strategy.id)}
              className={cn(
                'w-full p-4 text-left rounded-lg border-2 transition-colors',
                strategyId === strategy.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="font-medium text-gray-900">{strategy.code}</div>
              <div className="text-sm text-gray-600">{strategy.name}</div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Select Tactic */}
      {step === 2 && selectedStrategy && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setStep(1)} className="text-primary-600 hover:underline text-sm">
              ← กลับ
            </button>
            <Badge variant="default">{selectedStrategy.code}</Badge>
            <span className="text-sm text-gray-500">{selectedStrategy.name}</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">เลือกแผนกลยุทธ์</p>
          {selectedStrategy.tactics.map((tactic) => (
            <button
              key={tactic.id}
              onClick={() => handleTacticSelect(tactic.id)}
              className={cn(
                'w-full p-4 text-left rounded-lg border-2 transition-colors',
                tacticId === tactic.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="font-medium text-gray-900">{tactic.code}</div>
              <div className="text-sm text-gray-600">{tactic.name}</div>
              <div className="text-xs text-gray-400 mt-1">
                {tactic.kpis.length} KPIs
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 3: Select KPIs (Required) */}
      {step === 3 && selectedTactic && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setStep(2)} className="text-primary-600 hover:underline text-sm">
              ← กลับ
            </button>
            <Badge variant="default">{selectedStrategy?.code}</Badge>
            <span>›</span>
            <Badge variant="info">{selectedTactic.code}</Badge>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
            <strong className="text-yellow-800">สำคัญ:</strong>{' '}
            <span className="text-yellow-700">
              ต้องเลือก KPI อย่างน้อย 1 รายการที่งานนี้จะส่งผลกระทบโดยตรงหรือสนับสนุน
            </span>
          </div>

          <p className="text-sm text-gray-600">เลือก KPI ที่เกี่ยวข้อง ({selectedKPIs.length} รายการ)</p>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableKPIs.map((kpi) => {
              const isSelected = selectedKPIs.some((k) => k.kpiId === kpi.id)
              return (
                <div
                  key={kpi.id}
                  onClick={() => toggleKPI(kpi)}
                  className={cn(
                    'p-3 rounded-lg border-2 cursor-pointer transition-colors',
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{kpi.code}</div>
                      <div className="text-sm text-gray-600">{kpi.name}</div>
                      <div className="text-xs text-gray-400">หน่วย: {kpi.unit}</div>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center',
                        isSelected
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-gray-300'
                      )}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateKPILink(kpi.id, 'contributionType', 'DIRECT')}
                          className={cn(
                            'px-3 py-1 text-xs rounded-full',
                            selectedKPIs.find((k) => k.kpiId === kpi.id)?.contributionType === 'DIRECT'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          ส่งผลโดยตรง
                        </button>
                        <button
                          onClick={() => updateKPILink(kpi.id, 'contributionType', 'SUPPORT')}
                          className={cn(
                            'px-3 py-1 text-xs rounded-full',
                            selectedKPIs.find((k) => k.kpiId === kpi.id)?.contributionType === 'SUPPORT'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          สนับสนุน
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="ผลลัพธ์ที่คาดหวัง (ไม่บังคับ)"
                        value={selectedKPIs.find((k) => k.kpiId === kpi.id)?.expectedContributionNote || ''}
                        onChange={(e) => updateKPILink(kpi.id, 'expectedContributionNote', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <Button
            onClick={() => setStep(4)}
            disabled={!canProceedToStep4}
            className="w-full"
          >
            {canProceedToStep4 ? 'ถัดไป' : 'กรุณาเลือก KPI อย่างน้อย 1 รายการ'}
          </Button>
        </div>
      )}

      {/* Step 4: Task Details */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setStep(3)} className="text-primary-600 hover:underline text-sm">
              ← กลับ
            </button>
            <Badge variant="default">{selectedStrategy?.code}</Badge>
            <span>›</span>
            <Badge variant="info">{selectedTactic?.code}</Badge>
            <span>›</span>
            {selectedKPIs.map((k) => (
              <Badge key={k.kpiId} variant="success" size="sm">{k.kpiCode}</Badge>
            ))}
          </div>

          <Input
            label="ชื่องาน *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ระบุชื่องาน"
          />

          {/* Org & Team selector */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="สำนัก/หน่วยงานที่รับผิดชอบ"
              value={orgId?.toString() || ''}
              onChange={(e) => setOrgId(e.target.value ? parseInt(e.target.value) : null)}
              options={[
                { value: '', label: '-- ไม่ระบุ --' },
                ...orgs.map((o) => ({ value: o.id.toString(), label: o.name + (o.zone ? ` (${o.zone})` : '') })),
              ]}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ทีมที่รับผิดชอบ</label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto border rounded-lg p-2">
                {teams.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">ไม่มีทีม</p>
                ) : (
                  teams.map((team) => {
                    const isSelected = teamIds.includes(team.id)
                    return (
                      <label
                        key={team.id}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-sm',
                          isSelected ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setTeamIds(prev =>
                              isSelected
                                ? prev.filter(id => id !== team.id)
                                : [...prev, team.id]
                            )
                          }}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="truncate">{team.name}</span>
                        <span className="text-xs text-gray-400 ml-auto">({team._count.members})</span>
                      </label>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <Textarea
            label="รายละเอียด"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="ความสำคัญ"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              options={[
                { value: 'LOW', label: 'ต่ำ' },
                { value: 'NORMAL', label: 'ปกติ' },
                { value: 'HIGH', label: 'สูง' },
                { value: 'URGENT', label: 'เร่งด่วน' },
              ]}
            />
            <div />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="วันเริ่มต้น"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              label="วันครบกำหนด"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              ยกเลิก
            </Button>
            <Button onClick={handleSubmit} loading={loading} className="flex-1">
              สร้างงาน
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
