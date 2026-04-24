import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotesStore } from './notes'
import * as notesApi from '../api/notes'

vi.mock('../api/notes', () => ({
  getNotes: vi.fn(),
  createNote: vi.fn(),
  deleteNote: vi.fn(),
  uploadAttachment: vi.fn(),
  updateNote: vi.fn(),
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

    it('should return false if note not found', async () => {
      const store = useNotesStore()
      const result = await store.updateNote('non-existent', 'content')
      expect(result).toBe(false)
      expect(notesApi.updateNote).not.toHaveBeenCalled()
    })
  })
})
