import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from './settings'

const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

describe('settings store', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
  })

  it('should have default timezone', () => {
    const store = useSettingsStore()
    expect(store.timezone).toBe('Asia/Shanghai')
  })

  it('should update timezone and save to localStorage', () => {
    const store = useSettingsStore()
    store.setTimezone('America/New_York')
    expect(store.timezone).toBe('America/New_York')
    expect(window.localStorage.getItem('timezone')).toBe('America/New_York')
  })

  it('should load timezone from localStorage if set', () => {
    window.localStorage.setItem('timezone', 'Europe/London')
    const store = useSettingsStore()
    expect(store.timezone).toBe('Europe/London')
  })
})
