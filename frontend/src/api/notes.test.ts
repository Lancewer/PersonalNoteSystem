import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadAttachment } from './notes'
import request from './request'

vi.mock('./request', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('notes API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('uploadAttachment', () => {
    it('should POST to /api/notes/{id}/attachments with FormData', async () => {
      const noteId = 'test-note-id'
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const mockResponse = {
        id: 'att-id',
        file_type: 'image',
        file_path: '2026/04/24/attachment/image_20260424T120000.jpg',
      }

      vi.mocked(request.post).mockResolvedValue({ data: mockResponse })

      const result = await uploadAttachment(noteId, file)

      expect(request.post).toHaveBeenCalledWith(
        `/notes/${noteId}/attachments`,
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should throw error when upload fails', async () => {
      const noteId = 'test-note-id'
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })

      vi.mocked(request.post).mockRejectedValue(new Error('Upload failed'))

      await expect(uploadAttachment(noteId, file)).rejects.toThrow('Upload failed')
    })
  })
})
