import { describe, it, expect } from 'vitest'

// Import the utility function we're about to create
import { formatRelativeTime } from './time'

describe('formatRelativeTime', () => {
  it('should show 刚刚 for less than 1 minute', () => {
    const now = new Date('2026-04-24T08:00:00Z')
    const recent = new Date('2026-04-24T08:00:30Z')
    expect(formatRelativeTime(recent.toISOString(), now)).toBe('刚刚')
  })

  it('should show minutes ago for less than 1 hour', () => {
    const now = new Date('2026-04-24T08:00:00Z')
    const past = new Date('2026-04-24T07:30:00Z')
    expect(formatRelativeTime(past.toISOString(), now)).toBe('30分钟前')
  })

  it('should show hours ago for less than 24 hours', () => {
    const now = new Date('2026-04-24T08:00:00Z')
    const past = new Date('2026-04-24T03:00:00Z')
    expect(formatRelativeTime(past.toISOString(), now)).toBe('5小时前')
  })

  it('should show days ago for less than 7 days', () => {
    const now = new Date('2026-04-24T08:00:00Z')
    const past = new Date('2026-04-21T08:00:00Z')
    expect(formatRelativeTime(past.toISOString(), now)).toBe('3天前')
  })

  it('should show full datetime for older than 7 days', () => {
    const now = new Date('2026-04-24T08:00:00Z')
    const past = new Date('2026-04-10T08:00:00Z')
    const result = formatRelativeTime(past.toISOString(), now)
    // Should show date and time in local timezone
    expect(result).toMatch(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/)
  })

  it('should use Beijing time (UTC+8) for display', () => {
    const now = new Date('2026-04-24T16:00:00Z') // Beijing: 2026-04-25 00:00
    const past = new Date('2026-04-10T16:00:00Z') // Beijing: 2026-04-11 00:00
    const result = formatRelativeTime(past.toISOString(), now)
    // Should show Beijing time, not UTC
    expect(result).toContain('2026/04/11')
  })
})
