import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Note, Tag } from '../types'
import { getNotes, createNote as apiCreateNote, deleteNote as apiDeleteNote, uploadAttachment, updateNote as apiUpdateNote, deleteAttachment as apiDeleteAttachment } from '../api/notes'
import { getNotesByTag } from '../api/tags'

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
      let response
      if (activeTag.value) {
        response = await getNotesByTag(activeTag.value.id, skip)
      } else {
        response = await getNotes(skip)
      }
      // Backend returns notes in descending order (newest first)
      // We display in ascending order (oldest first)
      const reversedNotes = [...response.notes].reverse()
      
      if (reset) {
        notes.value = reversedNotes
      } else {
        // Prepend older notes to the beginning
        notes.value.unshift(...reversedNotes)
      }
      hasMore.value = response.has_more
      skip += response.notes.length
    } finally {
      loading.value = false
    }
  }

  async function createNote(content: string) {
    const newNote = await apiCreateNote(content)
    // Add new note to the end (newest position)
    notes.value.push(newNote)
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
    // Add new note to the end (newest position)
    notes.value.push(newNote)
  }

  async function updateNote(id: string, content: string, newFiles: File[] = [], removedAttIds: string[] = []): Promise<boolean> {
    const index = notes.value.findIndex(n => n.id === id)
    if (index === -1) return false

    const updated = await apiUpdateNote(id, content)

    for (const attId of removedAttIds) {
      try {
        await apiDeleteAttachment(attId)
      } catch (e) {
        console.error('Delete attachment failed:', e)
      }
    }
    updated.attachments = updated.attachments.filter(a => !removedAttIds.includes(a.id))

    for (const file of newFiles) {
      try {
        const attachment = await uploadAttachment(id, file)
        updated.attachments.push(attachment)
      } catch (e) {
        console.error('Upload attachment failed:', e)
      }
    }

    notes.value[index] = updated
    return true
  }

  async function removeAttachment(noteId: string, attachmentId: string): Promise<boolean> {
    const note = notes.value.find(n => n.id === noteId)
    if (!note) return false
    await apiDeleteAttachment(attachmentId)
    note.attachments = note.attachments.filter(a => a.id !== attachmentId)
    return true
  }

  async function removeNote(id: string) {
    await apiDeleteNote(id)
    notes.value = notes.value.filter(n => n.id !== id)
  }

  function filterByTag(tag: Tag | null) {
    activeTag.value = tag
  }

  return { notes, loading, hasMore, activeTag, fetchNotes, createNote, createNoteWithAttachments, updateNote, removeAttachment, removeNote, filterByTag }
})
