import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotesStore } from './notes'
import * as notesApi from '../api/notes'
import * as tagsApi from '../api/tags'

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

describe('notes store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('createNoteWithAttachments', () => {
    it('should create note and upload attachments', async () => {
      const store = useNotesStore()
      const mockNote = {
        id: 'note-1',
        content: 'Hello world',
        created_at: '2026-04-24T12:00:00Z',
        tags: [],
        attachments: [],
      }
      const mockAttachment = {
        id: 'att-1',
        file_type: 'image',
        file_path: '2026/04/24/attachment/image_20260424T120000.jpg',
      }

      vi.mocked(notesApi.createNote).mockResolvedValue(mockNote)
      vi.mocked(notesApi.uploadAttachment).mockResolvedValue(mockAttachment)

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      await store.createNoteWithAttachments('Hello world', [file])

      expect(notesApi.createNote).toHaveBeenCalledWith('Hello world')
      expect(notesApi.uploadAttachment).toHaveBeenCalledWith('note-1', file)
      expect(store.notes[0].attachments).toHaveLength(1)
    })

    it('should create note without attachments when file list is empty', async () => {
      const store = useNotesStore()
      const mockNote = {
        id: 'note-1',
        content: 'Hello world',
        created_at: '2026-04-24T12:00:00Z',
        tags: [],
        attachments: [],
      }

      vi.mocked(notesApi.createNote).mockResolvedValue(mockNote)

      await store.createNoteWithAttachments('Hello world', [])

      expect(notesApi.createNote).toHaveBeenCalledWith('Hello world')
      expect(notesApi.uploadAttachment).not.toHaveBeenCalled()
      expect(store.notes[0]).toEqual(mockNote)
    })

    it('should add note to list even if attachment upload fails', async () => {
      const store = useNotesStore()
      const mockNote = {
        id: 'note-1',
        content: 'Hello world',
        created_at: '2026-04-24T12:00:00Z',
        tags: [],
        attachments: [],
      }

      vi.mocked(notesApi.createNote).mockResolvedValue(mockNote)
      vi.mocked(notesApi.uploadAttachment).mockRejectedValue(new Error('Upload failed'))

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      await store.createNoteWithAttachments('Hello world', [file])

      expect(store.notes[0]).toEqual(mockNote)
    })
  })

  describe('updateNote', () => {
    it('should update note content in the store', async () => {
      const store = useNotesStore()
      const originalNote = {
        id: 'note-1',
        content: 'Original content',
        created_at: '2026-04-24T12:00:00Z',
        tags: [],
        attachments: [],
      }
      const updatedNote = {
        ...originalNote,
        content: 'Updated content',
        tags: [{ id: 'tag-1', name: 'new', parent_id: null }],
      }

      store.notes.push(originalNote)
      vi.mocked(notesApi.updateNote).mockResolvedValue(updatedNote)

      await store.updateNote('note-1', 'Updated content')

      expect(notesApi.updateNote).toHaveBeenCalledWith('note-1', 'Updated content')
      expect(store.notes[0].content).toBe('Updated content')
      expect(store.notes[0].tags).toHaveLength(1)
    })
  })

  describe('removeAttachment', () => {
    it('should remove attachment from note and delete from server', async () => {
      const store = useNotesStore()
      const mockNote = {
        id: 'note-1',
        content: 'Hello',
        created_at: '2026-04-24T12:00:00Z',
        tags: [],
        attachments: [
          { id: 'att-1', file_type: 'image', file_path: 'path1.jpg', original_name: '1.jpg', file_size: 100 },
          { id: 'att-2', file_type: 'image', file_path: 'path2.jpg', original_name: '2.jpg', file_size: 200 },
        ],
      }
      store.notes.push(mockNote)

      await store.removeAttachment('note-1', 'att-1')

      expect(notesApi.deleteAttachment).toHaveBeenCalledWith('att-1')
      expect(store.notes[0].attachments).toHaveLength(1)
      expect(store.notes[0].attachments[0].id).toBe('att-2')
    })

    it('should return false if note not found', async () => {
      const store = useNotesStore()
      const result = await store.updateNote('non-existent', 'content')
      expect(result).toBe(false)
      expect(notesApi.updateNote).not.toHaveBeenCalled()
    })

    it('should upload new files and remove deleted attachments', async () => {
      const store = useNotesStore()
      const originalNote = {
        id: 'note-1',
        content: 'Hello',
        created_at: '2026-04-24T12:00:00Z',
        tags: [],
        attachments: [
          { id: 'att-1', file_type: 'image', file_path: 'p1.jpg', original_name: '1.jpg', file_size: 100 },
        ],
      }
      const updatedNote = {
        ...originalNote,
        content: 'Updated',
      }
      const newAttachment = { id: 'att-new', file_type: 'image', file_path: 'new.jpg', original_name: 'new.jpg', file_size: 200 }

      store.notes.push(originalNote)
      vi.mocked(notesApi.updateNote).mockResolvedValue(updatedNote)
      vi.mocked(notesApi.uploadAttachment).mockResolvedValue(newAttachment)

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      await store.updateNote('note-1', 'Updated', [file], ['att-1'])

      expect(notesApi.deleteAttachment).toHaveBeenCalledWith('att-1')
      expect(notesApi.uploadAttachment).toHaveBeenCalledWith('note-1', file)
      expect(store.notes[0].attachments).toHaveLength(1)
      expect(store.notes[0].attachments[0].id).toBe('att-new')
    })
  })

  describe('filterByTag', () => {
    it('should set active tag', () => {
      const store = useNotesStore()
      const tag = { id: 'tag-1', name: '工作', parent_id: null }
      store.filterByTag(tag)
      expect(store.activeTag).toEqual(tag)
    })

    it('should clear active tag when passing null', () => {
      const store = useNotesStore()
      store.filterByTag({ id: 'tag-1', name: '工作', parent_id: null })
      store.filterByTag(null)
      expect(store.activeTag).toBeNull()
    })
  })

  describe('fetchNotes with tag filter', () => {
    it('should call getNotesByTag when activeTag is set', async () => {
      const store = useNotesStore()
      const mockResponse = {
        notes: [
          { id: 'note-1', content: 'Tagged', created_at: '2026-04-24T12:00:00Z', tags: [{ id: 'tag-1', name: '工作', parent_id: null }], attachments: [] },
        ],
        has_more: false,
      }
      vi.mocked(notesApi.getNotes).mockResolvedValue({ notes: [], has_more: false })
      vi.mocked(tagsApi.getNotesByTag).mockResolvedValue(mockResponse)

      store.filterByTag({ id: 'tag-1', name: '工作', parent_id: null })
      await store.fetchNotes(true)

      expect(tagsApi.getNotesByTag).toHaveBeenCalledWith('tag-1', 0)
      expect(notesApi.getNotes).not.toHaveBeenCalled()
    })

    it('should call getNotes when activeTag is null', async () => {
      const store = useNotesStore()
      const mockResponse = {
        notes: [
          { id: 'note-1', content: 'All', created_at: '2026-04-24T12:00:00Z', tags: [], attachments: [] },
        ],
        has_more: false,
      }
      vi.mocked(notesApi.getNotes).mockResolvedValue(mockResponse)

      store.filterByTag(null)
      await store.fetchNotes(true)

      expect(notesApi.getNotes).toHaveBeenCalledWith(0)
      expect(tagsApi.getNotesByTag).not.toHaveBeenCalled()
    })
  })

  describe('fetchNotes ordering', () => {
    it('should display notes in ascending order (oldest first)', async () => {
      const store = useNotesStore()
      const mockResponse = {
        notes: [
          { id: 'note-new', content: 'New', created_at: '2026-04-24T12:00:00Z', tags: [], attachments: [] },
          { id: 'note-old', content: 'Old', created_at: '2026-04-23T12:00:00Z', tags: [], attachments: [] },
        ],
        has_more: false,
      }
      vi.mocked(notesApi.getNotes).mockResolvedValue(mockResponse)

      await store.fetchNotes(true)

      // Should be reversed: oldest first
      expect(store.notes[0].id).toBe('note-old')
      expect(store.notes[1].id).toBe('note-new')
    })

    it('should add new note to the end (newest position)', async () => {
      const store = useNotesStore()
      store.notes = [
        { id: 'note-old', content: 'Old', created_at: '2026-04-23T12:00:00Z', tags: [], attachments: [] },
      ]
      const newNote = {
        id: 'note-new',
        content: 'New',
        created_at: '2026-04-24T12:00:00Z',
        tags: [],
        attachments: [],
      }
      vi.mocked(notesApi.createNote).mockResolvedValue(newNote)

      await store.createNote('New content')

      expect(store.notes[store.notes.length - 1].id).toBe('note-new')
    })
  })
})
