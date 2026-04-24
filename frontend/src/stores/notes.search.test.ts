import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotesStore } from './notes'

describe('notes store search', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should filter notes by search query', () => {
    const store = useNotesStore()
    store.notes = [
      { id: '1', content: 'Hello world', created_at: '2026-04-24T12:00:00Z', tags: [], attachments: [] },
      { id: '2', content: 'Goodbye world', created_at: '2026-04-24T11:00:00Z', tags: [], attachments: [] },
      { id: '3', content: 'Something else', created_at: '2026-04-24T10:00:00Z', tags: [], attachments: [] },
    ]

    store.searchQuery = 'Hello'
    expect(store.filteredNotes).toHaveLength(1)
    expect(store.filteredNotes[0].id).toBe('1')
  })

  it('should return all notes when search query is empty', () => {
    const store = useNotesStore()
    store.notes = [
      { id: '1', content: 'Hello world', created_at: '2026-04-24T12:00:00Z', tags: [], attachments: [] },
      { id: '2', content: 'Goodbye world', created_at: '2026-04-24T11:00:00Z', tags: [], attachments: [] },
    ]

    store.searchQuery = ''
    expect(store.filteredNotes).toHaveLength(2)
  })

  it('should search case insensitively', () => {
    const store = useNotesStore()
    store.notes = [
      { id: '1', content: 'HELLO world', created_at: '2026-04-24T12:00:00Z', tags: [], attachments: [] },
      { id: '2', content: 'Goodbye', created_at: '2026-04-24T11:00:00Z', tags: [], attachments: [] },
    ]

    store.searchQuery = 'hello'
    expect(store.filteredNotes).toHaveLength(1)
    expect(store.filteredNotes[0].id).toBe('1')
  })

  it('should clear search query', () => {
    const store = useNotesStore()
    store.searchQuery = 'test'
    store.clearSearch()
    expect(store.searchQuery).toBe('')
  })
})
