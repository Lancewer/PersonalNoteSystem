import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NoteCard from './NoteCard.vue'

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

vi.mock('../stores/settings', () => ({
  useSettingsStore: () => ({ timezone: 'Asia/Shanghai' }),
}))

const mockNote = {
  id: 'note-1',
  content: '这是一条测试笔记',
  created_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
  tags: [],
  attachments: [],
}

describe('NoteCard', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('should render note content', () => {
    const wrapper = mount(NoteCard, {
      props: { note: mockNote },
    })
    expect(wrapper.text()).toContain('这是一条测试笔记')
  })

  it('should show icon buttons for edit and delete', () => {
    const wrapper = mount(NoteCard, {
      props: { note: mockNote },
    })
    const buttons = wrapper.findAll('button.note-action-btn')
    expect(buttons).toHaveLength(2)
  })

  it('should emit delete event when delete button clicked', async () => {
    const wrapper = mount(NoteCard, {
      props: { note: mockNote },
    })
    const deleteBtn = wrapper.findAll('button.note-action-btn')[1]
    await deleteBtn.trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')![0]).toEqual(['note-1'])
  })

  it('should emit view event when card clicked', async () => {
    const wrapper = mount(NoteCard, {
      props: { note: mockNote },
    })
    const card = wrapper.find('.note-card-body')
    await card.trigger('click')
    expect(wrapper.emitted('view')).toBeTruthy()
    expect(wrapper.emitted('view')![0]).toEqual(['note-1'])
  })

  it('should show tags when note has tags', () => {
    const noteWithTags = {
      ...mockNote,
      tags: [{ id: 'tag-1', name: '工作', parent_id: null }],
    }
    const wrapper = mount(NoteCard, {
      props: { note: noteWithTags },
    })
    expect(wrapper.text()).toContain('#工作')
  })

  it('should truncate content and show expand indicator for long notes', () => {
    const longNote = {
      ...mockNote,
      content: '这是一条很长的测试笔记内容，超过显示限制的文字应该被截断显示。我们需要更多的文字来确保内容长度超过一百二十个字符的限制，这样才能正确触发截断逻辑。这是额外添加的测试文字内容，用来确保长度足够长。继续添加更多文字以确保超过限制。再添加一些内容来确保测试通过。',
    }
    const wrapper = mount(NoteCard, {
      props: { note: longNote },
    })
    expect(wrapper.find('.note-content-truncated').exists()).toBe(true)
  })

  it('should not truncate short notes', () => {
    const shortNote = {
      ...mockNote,
      content: '短笔记',
    }
    const wrapper = mount(NoteCard, {
      props: { note: shortNote },
    })
    expect(wrapper.find('.note-content-truncated').exists()).toBe(false)
  })
})
