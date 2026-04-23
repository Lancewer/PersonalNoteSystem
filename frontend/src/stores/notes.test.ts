import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotesStore } from './notes'
import * as notesApi from '../api/notes'

vi.mock('../api/notes', () => ({
  getNotes: vi.fn(),
  createNote: vi.fn(),
  deleteNote: vi.fn(),
  uploadAttachment: vi.fn(),
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
})
