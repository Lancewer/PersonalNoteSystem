import { describe, it, expect } from 'vitest'
import { formatRelativeTime } from './time'

describe('formatRelativeTime', () => {
  const now = new Date('2026-04-24T16:00:00Z') // Beijing: 2026-04-25 00:00

  it('should show 刚刚 for less than 1 minute', () => {
    const recent = new Date('2026-04-24T15:59:30Z')
    expect(formatRelativeTime(recent.toISOString(), 'Asia/Shanghai', now)).toBe('刚刚')
  })

  it('should show minutes ago for less than 1 hour', () => {
    const past = new Date('2026-04-24T15:30:00Z')
    expect(formatRelativeTime(past.toISOString(), 'Asia/Shanghai', now)).toBe('30分钟前')
  })

  it('should show hours ago for less than 24 hours', () => {
    const past = new Date('2026-04-24T11:00:00Z')
    expect(formatRelativeTime(past.toISOString(), 'Asia/Shanghai', now)).toBe('5小时前')
  })

  it('should show days ago for less than 7 days', () => {
    const past = new Date('2026-04-21T16:00:00Z')
    expect(formatRelativeTime(past.toISOString(), 'Asia/Shanghai', now)).toBe('3天前')
  })

  it('should show full datetime for older than 7 days in specified timezone', () => {
    const past = new Date('2026-04-10T16:00:00Z') // Beijing: 2026-04-11 00:00
    const result = formatRelativeTime(past.toISOString(), 'Asia/Shanghai', now)
    expect(result).toBe('2026/04/11 00:00')
  })

  it('should show different time for different timezone', () => {
    const past = new Date('2026-04-10T16:00:00Z')
    // Beijing: 2026-04-11 00:00, New York: 2026-04-10 12:00
    const beijingResult = formatRelativeTime(past.toISOString(), 'Asia/Shanghai', now)
    const nyResult = formatRelativeTime(past.toISOString(), 'America/New_York', now)

    expect(beijingResult).toBe('2026/04/11 00:00')
    expect(nyResult).toBe('2026/04/10 12:00')
  })

  it('should use default timezone Asia/Shanghai if not specified', () => {
    const past = new Date('2026-04-10T16:00:00Z')
    const result = formatRelativeTime(past.toISOString(), undefined, now)
    expect(result).toBe('2026/04/11 00:00')
  })
})
