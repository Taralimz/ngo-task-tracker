'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseAutoLogoutOptions {
  /** Idle timeout in minutes before showing warning (default: 15) */
  timeoutMinutes?: number
  /** Warning countdown in seconds before auto logout (default: 60) */
  warningSeconds?: number
  /** Callback after logout */
  onLogout?: () => void
}

interface UseAutoLogoutReturn {
  /** Whether the warning modal is visible */
  showWarning: boolean
  /** Seconds remaining before auto logout */
  remainingSeconds: number
  /** Call to dismiss warning and reset timer */
  stayLoggedIn: () => void
  /** Call to logout immediately */
  logoutNow: () => void
}

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
]

export function useAutoLogout(options: UseAutoLogoutOptions = {}): UseAutoLogoutReturn {
  const {
    timeoutMinutes = 15,
    warningSeconds = 60,
    onLogout,
  } = options

  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(warningSeconds)

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const isWarningRef = useRef(false)

  const timeoutMs = timeoutMinutes * 60 * 1000

  const performLogout = useCallback(async () => {
    // Clear all timers
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)

    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Proceed even if request fails
    }

    if (onLogout) {
      onLogout()
    } else {
      router.push('/login?reason=timeout')
    }
  }, [onLogout, router])

  const startCountdown = useCallback(() => {
    isWarningRef.current = true
    setShowWarning(true)
    setRemainingSeconds(warningSeconds)

    let seconds = warningSeconds
    countdownRef.current = setInterval(() => {
      seconds -= 1
      setRemainingSeconds(seconds)

      if (seconds <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current)
        performLogout()
      }
    }, 1000)
  }, [warningSeconds, performLogout])

  const resetIdleTimer = useCallback(() => {
    // Don't reset if warning is showing
    if (isWarningRef.current) return

    lastActivityRef.current = Date.now()

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      startCountdown()
    }, timeoutMs)
  }, [timeoutMs, startCountdown])

  const stayLoggedIn = useCallback(() => {
    // Cancel countdown
    if (countdownRef.current) clearInterval(countdownRef.current)
    isWarningRef.current = false
    setShowWarning(false)
    setRemainingSeconds(warningSeconds)

    // Reset idle timer
    resetIdleTimer()
  }, [warningSeconds, resetIdleTimer])

  const logoutNow = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current)
    setShowWarning(false)
    performLogout()
  }, [performLogout])

  // Set up activity listeners
  useEffect(() => {
    // Throttle activity handler to avoid excessive resets
    let throttleTimer: NodeJS.Timeout | null = null
    const handleActivity = () => {
      if (throttleTimer) return
      throttleTimer = setTimeout(() => {
        throttleTimer = null
        resetIdleTimer()
      }, 1000)
    }

    // Start initial timer
    resetIdleTimer()

    // Listen for user activity
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Listen for visibility change (tab switch back)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !isWarningRef.current) {
        // Check if we've been idle too long while tab was hidden
        const elapsed = Date.now() - lastActivityRef.current
        if (elapsed >= timeoutMs) {
          startCountdown()
        } else {
          resetIdleTimer()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // Listen for storage events (cross-tab logout sync)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'auto_logout' && e.newValue === 'true') {
        performLogout()
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
      if (throttleTimer) clearTimeout(throttleTimer)

      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('storage', handleStorage)
    }
  }, [resetIdleTimer, startCountdown, performLogout, timeoutMs])

  return {
    showWarning,
    remainingSeconds,
    stayLoggedIn,
    logoutNow,
  }
}
