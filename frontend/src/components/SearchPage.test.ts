import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SearchPage from './SearchPage.vue'
import { useNotesStore } from '../stores/notes'

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

describe('SearchPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render search input', () => {
    const wrapper = mount(SearchPage, {
      props: { modelValue: true },
      attachTo: document.body,
      global: { stubs: { teleport: true } },
    })
    expect(wrapper.find('.search-input').exists()).toBe(true)
  })

  it('should emit close when close button clicked', async () => {
    const wrapper = mount(SearchPage, {
      props: { modelValue: true },
      attachTo: document.body,
      global: { stubs: { teleport: true } },
    })
    await wrapper.find('[aria-label="关闭搜索"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('should update store searchQuery when typing', async () => {
    const wrapper = mount(SearchPage, {
      props: { modelValue: true },
      attachTo: document.body,
      global: { stubs: { teleport: true } },
    })
    const store = useNotesStore()
    await wrapper.find('.search-input').setValue('test')
    expect(store.searchQuery).toBe('test')
  })

  it('should render quick filter tags', () => {
    const wrapper = mount(SearchPage, {
      props: { modelValue: true },
      attachTo: document.body,
      global: { stubs: { teleport: true } },
    })
    expect(wrapper.find('.quick-filters').exists()).toBe(true)
    expect(wrapper.findAll('.filter-tag')).toHaveLength(5)
  })
})
