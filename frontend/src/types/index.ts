export interface User {
  id: string
  username: string
}

export interface Note {
  id: string
  content: string
  created_at: string
  tags: Tag[]
  attachments: Attachment[]
}

export interface Tag {
  id: string
  name: string
  parent_id: string | null
  children?: Tag[]
  note_count?: number
}

export interface Attachment {
  id: string
  file_type: 'image' | 'audio' | 'file'
  file_path: string
  original_name: string
  file_size: number
}

export interface NoteListResponse {
  notes: Note[]
  has_more: boolean
}

export interface TokenResponse {
  access_token: string
  token_type: string
}
