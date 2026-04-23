import request from './request'
import type { Note, NoteListResponse } from '../types'

export const createNote = (content: string): Promise<Note> => {
  return request.post('/notes', { content }).then(res => res.data)
}

export const getNotes = (skip = 0, limit = 20): Promise<NoteListResponse> => {
  return request.get('/notes', { params: { skip, limit } }).then(res => res.data)
}

export const getNote = (id: string): Promise<Note> => {
  return request.get(`/notes/${id}`).then(res => res.data)
}

export const updateNote = (id: string, content: string): Promise<Note> => {
  return request.put(`/notes/${id}`, { content }).then(res => res.data)
}

export const deleteNote = (id: string): Promise<void> => {
  return request.delete(`/notes/${id}`).then(() => undefined)
}

export const uploadAttachment = (noteId: string, file: File): Promise<{ id: string; file_type: string; file_path: string }> => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`/notes/${noteId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(res => res.data)
}
