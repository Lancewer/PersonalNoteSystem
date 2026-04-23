import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Note, Tag } from '../types'
import { getNotes, createNote as apiCreateNote, deleteNote as apiDeleteNote, uploadAttachment } from '../api/notes'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const activeTag = ref<Tag | null>(null)
  let skip = 0

  async function fetchNotes(reset = false) {
    if (loading.value) return
    if (reset) {
      skip = 0
      notes.value = []
    }
    if (!hasMore.value && !reset) return

    loading.value = true
    try {
      const response = await getNotes(skip)
      if (reset) {
        notes.value = response.notes
      } else {
        notes.value.push(...response.notes)
      }
      hasMore.value = response.has_more
      skip += response.notes.length
    } finally {
      loading.value = false
    }
  }

  async function createNote(content: string) {
    const newNote = await apiCreateNote(content)
    notes.value.unshift(newNote)
  }

  async function createNoteWithAttachments(content: string, files: File[]) {
    const newNote = await apiCreateNote(content)
    for (const file of files) {
      try {
        const attachment = await uploadAttachment(newNote.id, file)
        newNote.attachments.push(attachment)
      } catch (e) {
        console.error('Attachment upload failed:', e)
      }
    }
    notes.value.unshift(newNote)
  }

  async function removeNote(id: string) {
    await apiDeleteNote(id)
    notes.value = notes.value.filter(n => n.id !== id)
  }

  function filterByTag(tag: Tag | null) {
    activeTag.value = tag
  }

  return { notes, loading, hasMore, activeTag, fetchNotes, createNote, createNoteWithAttachments, removeNote, filterByTag }
})
