import request from './request'
import type { Tag, NoteListResponse } from '../types'

export const getTags = (): Promise<Tag[]> => {
  return request.get('/tags').then(res => res.data)
}

export const createTag = (name: string, parentId: string | null = null): Promise<Tag> => {
  return request.post('/tags', { name, parent_id: parentId }).then(res => res.data)
}

export const getNotesByTag = (tagId: string, skip = 0): Promise<NoteListResponse> => {
  return request.get(`/tags/${tagId}/notes`, { params: { skip } }).then(res => res.data)
}
