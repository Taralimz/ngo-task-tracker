'use client'

import { cn } from '@/lib/utils'

interface AutoLogoutWarningProps {
  show: boolean
  remainingSeconds: number
  onStay: () => void
  onLogout: () => void
}

export function AutoLogoutWarning({ show, remainingSeconds, onStay, onLogout }: AutoLogoutWarningProps) {
  if (!show) return null

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const timeDisplay = minutes > 0
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : `${seconds}`
  const isUrgent = remainingSeconds <= 15
  const progressPercent = (remainingSeconds / 60) * 100

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm px-4 sm:px-0 pointer-events-none animate-fade-in">
      <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-gray-200/60 w-full overflow-hidden animate-fade-in-up">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <progress
            value={progressPercent}
            max={100}
            className={cn(
              'w-full h-full rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-gray-100 [&::-webkit-progress-value]:transition-all [&::-webkit-progress-value]:duration-1000 [&::-webkit-progress-value]:ease-linear [&::-moz-progress-bar]:transition-all [&::-moz-progress-bar]:duration-1000 [&::-moz-progress-bar]:ease-linear',
              isUrgent
                ? '[&::-webkit-progress-value]:bg-red-500 [&::-moz-progress-bar]:bg-red-500'
                : '[&::-webkit-progress-value]:bg-amber-500 [&::-moz-progress-bar]:bg-amber-500'
            )}
          />
        </div>

        <div className="p-6">
          {/* Icon */}
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-500',
            isUrgent ? 'bg-red-100' : 'bg-amber-100'
          )}>
            <svg
              className={cn(
                'w-8 h-8 transition-colors duration-500',
                isUrgent ? 'text-red-600 animate-pulse' : 'text-amber-600'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Text */}
          <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
            เซสชันกำลังหมดอายุ
          </h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            ไม่มีการใช้งานมาสักครู่ ระบบจะออกจากระบบอัตโนมัติใน
          </p>

          {/* Countdown */}
          <div className={cn(
            'text-4xl font-bold text-center mb-5 tabular-nums transition-colors duration-500',
            isUrgent ? 'text-red-600' : 'text-amber-600'
          )}>
            {timeDisplay}
            <span className="text-base font-normal text-gray-400 ml-1">วินาที</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onLogout}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
            >
              ออกจากระบบ
            </button>
            <button
              onClick={onStay}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              ใช้งานต่อ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
