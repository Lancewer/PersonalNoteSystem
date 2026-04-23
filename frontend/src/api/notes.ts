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
