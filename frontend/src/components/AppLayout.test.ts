import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AppLayout from './AppLayout.vue'
import { useNotesStore } from '../stores/notes'

const originalInnerWidth = window.innerWidth

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

vi.mock('../stores/auth', () => ({
  useAuthStore: () => ({ doLogout: vi.fn() }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {} }),
  RouterLink: { template: '<a><slot /></a>' },
}))

vi.mock('../api/notes', () => ({
  getNotes: vi.fn(),
  createNote: vi.fn(),
  deleteNote: vi.fn(),
  uploadAttachment: vi.fn(),
  updateNote: vi.fn(),
  deleteAttachment: vi.fn(),
}))

vi.mock('../api/tags', () => ({
  getNotesByTag: vi.fn(),
  getTags: vi.fn(),
  createTag: vi.fn(),
}))

describe('AppLayout', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    window.innerWidth = originalInnerWidth
    window.dispatchEvent(new Event('resize'))
  })

  it('should render search input in sidebar', () => {
    const wrapper = mount(AppLayout, {
      slots: { default: '<div>Content</div>' },
    })
    expect(wrapper.find('.sidebar-search').exists()).toBe(true)
    expect(wrapper.find('.sidebar-search-input').exists()).toBe(true)
  })

  it('should update store searchQuery when typing', async () => {
    const wrapper = mount(AppLayout, {
      slots: { default: '<div>Content</div>' },
    })
    const store = useNotesStore()
    const input = wrapper.find('.sidebar-search-input')
    await input.setValue('test')
    expect(store.searchQuery).toBe('test')
  })

  it('should clear search when input is cleared', async () => {
    const wrapper = mount(AppLayout, {
      slots: { default: '<div>Content</div>' },
    })
    const store = useNotesStore()
    const input = wrapper.find('.sidebar-search-input')
    await input.setValue('test')
    await input.setValue('')
    expect(store.searchQuery).toBe('')
  })

  describe('mobile drawer', () => {
    it('should open drawer when hamburger clicked', async () => {
      window.innerWidth = 500
      window.dispatchEvent(new Event('resize'))
      
      const wrapper = mount(AppLayout, {
        slots: { default: '<div>Content</div>' },
        attachTo: document.body,
        global: {
          stubs: { teleport: true }
        }
      })
      await wrapper.vm.$nextTick()

      const hamburger = wrapper.find('[aria-label="打开菜单"]')
      await hamburger.trigger('click')
      expect(wrapper.find('.sidebar-drawer').classes()).toContain('drawer-open')
    })

    it('should close drawer when overlay clicked', async () => {
      window.innerWidth = 500
      window.dispatchEvent(new Event('resize'))
      
      const wrapper = mount(AppLayout, {
        slots: { default: '<div>Content</div>' },
        attachTo: document.body,
        global: {
          stubs: { teleport: true }
        }
      })
      await wrapper.vm.$nextTick()

      await wrapper.find('[aria-label="打开菜单"]').trigger('click')
      await wrapper.find('.drawer-overlay').trigger('click')
      expect(wrapper.find('.sidebar-drawer').classes()).not.toContain('drawer-open')
    })
  })
})
