import type { ComponentPublicInstance } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Timeline from '../src/views/Timeline.vue'
import { useNotesStore } from '../src/stores/notes'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((key) => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
})

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: {},
  }),
  useRouter: () => ({
    replace: vi.fn(),
  }),
}))

// Mock API
vi.mock('../src/api/tags', () => ({
  getTags: vi.fn().mockResolvedValue([]),
}))

vi.mock('../src/api/notes', () => ({
  getNotes: vi.fn().mockResolvedValue({ notes: [] }),
  createNote: vi.fn().mockResolvedValue({}),
  updateNote: vi.fn().mockResolvedValue({}),
  deleteNote: vi.fn().mockResolvedValue({}),
}))

describe('Timeline.vue', () => {
  let wrapper: VueWrapper

  beforeEach(async () => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders SearchPage component', async () => {
    wrapper = mount(Timeline, {
      global: {
        stubs: {
          NoteCard: { template: '<div class="note-card-stub" /><slot />', name: 'NoteCard' },
          NoteEditor: { template: '<div class="note-editor-stub" />', name: 'NoteEditor' },
        },
      },
    })

    await flushPromises()

    // SearchPage should be present in the component
    expect(wrapper.findComponent({ name: 'SearchPage' }).exists()).toBe(true)
  })

  it('shows SearchPage when search-open event is emitted from AppLayout', async () => {
    wrapper = mount(Timeline, {
      global: {
        stubs: {
          NoteCard: true,
          NoteEditor: true,
          AppLayout: {
            template: '<div class="app-layout-stub"><slot /></div>',
            name: 'AppLayout',
          },
          SearchPage: {
            template: '<div v-if="modelValue" class="search-page-visible">Search</div>',
            props: ['modelValue'],
            name: 'SearchPage',
          },
        },
      },
    })

    await flushPromises()

    // Emit search-open from AppLayout stub
    const appLayout = wrapper.findComponent({ name: 'AppLayout' })
    const appLayoutInstance = appLayout.vm as ComponentPublicInstance
    appLayoutInstance.$emit('search-open')
    await wrapper.vm.$nextTick()
    await flushPromises()

    // SearchPage should be visible (modelValue should be true)
    expect(wrapper.find('.search-page-visible').exists()).toBe(true)
  })

  it('passes note-delete event from SearchPage to handleDelete', async () => {
    const notesStore = useNotesStore()
    vi.spyOn(notesStore, 'removeNote').mockResolvedValue(undefined)

    // Mock confirm dialog
    vi.stubGlobal('confirm', vi.fn(() => true))

    wrapper = mount(Timeline, {
      global: {
        stubs: {
          NoteCard: { template: '<div class="note-card-stub" /><slot />', name: 'NoteCard' },
          NoteEditor: { template: '<div class="note-editor-stub" />', name: 'NoteEditor' },
          AppLayout: { template: '<div class="app-layout-stub"><slot /></div>', name: 'AppLayout' },
        },
      },
    })

    await flushPromises()

    const searchPage = wrapper.findComponent({ name: 'SearchPage' })
    searchPage.vm.$emit('note-delete', 'test-note-id')
    await wrapper.vm.$nextTick()
    await flushPromises()

    expect(notesStore.removeNote).toHaveBeenCalledWith('test-note-id')
    
    vi.unstubAllGlobals()
  })

  it('passes note-update event from SearchPage to handleUpdate', async () => {
    const notesStore = useNotesStore()
    vi.spyOn(notesStore, 'updateNote').mockResolvedValue(undefined)

    wrapper = mount(Timeline, {
      global: {
        stubs: {
          NoteCard: { template: '<div class="note-card-stub" /><slot />', name: 'NoteCard' },
          NoteEditor: { template: '<div class="note-editor-stub" />', name: 'NoteEditor' },
          AppLayout: { template: '<div class="app-layout-stub"><slot /></div>', name: 'AppLayout' },
        },
      },
    })

    await flushPromises()

    const searchPage = wrapper.findComponent({ name: 'SearchPage' })
    searchPage.vm.$emit('note-update', 'test-note-id', 'updated content', [], [])
    await wrapper.vm.$nextTick()
    await flushPromises()

    expect(notesStore.updateNote).toHaveBeenCalledWith('test-note-id', 'updated content', [], [])
  })
})
