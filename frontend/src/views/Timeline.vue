<template>
  <AppLayout>
    <div class="timeline-container">
      <div v-if="activeTag" class="filter-bar">
        <span class="filter-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>
            <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>
          </svg>
          标签：#{{ activeTag.name }}
        </span>
        <button class="filter-clear" @click="clearFilter">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
          清除
        </button>
      </div>

      <div v-if="notesStore.notes.length === 0 && !notesStore.loading" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        <p v-if="activeTag">该标签下还没有笔记</p>
        <p v-else>还没有笔记，在下方开始记录你的想法</p>
      </div>

      <NoteCard
        v-for="note in notesStore.notes"
        :key="note.id"
        :note="note"
        @delete="handleDelete"
        @update="handleUpdate"
      />

      <div v-if="notesStore.loading" class="loading">
        <div class="loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>

      <div class="inline-editor">
        <NoteEditor @submit="handleCreate" />
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotesStore } from '../stores/notes'
import { getTags } from '../api/tags'
import type { Tag } from '../types'
import NoteCard from '../components/NoteCard.vue'
import NoteEditor from '../components/NoteEditor.vue'
import AppLayout from '../components/AppLayout.vue'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()

async function resolveTag(tagId: string): Promise<Tag | null> {
  const allTags = await getTags()
  return findTagById(allTags, tagId)
}

function findTagById(tags: Tag[], tagId: string): Tag | null {
  for (const tag of tags) {
    if (tag.id === tagId) return tag
    if (tag.children) {
      const found = findTagById(tag.children, tagId)
      if (found) return found
    }
  }
  return null
}

onMounted(async () => {
  const tagId = route.query.tag as string
  if (tagId) {
    const tag = await resolveTag(tagId)
    if (tag) {
      notesStore.filterByTag(tag)
    }
  }
  notesStore.fetchNotes(true)
})

watch(() => route.query.tag, async (newTagId) => {
  if (newTagId) {
    const tag = await resolveTag(newTagId as string)
    if (tag) {
      notesStore.filterByTag(tag)
    }
  } else {
    notesStore.filterByTag(null)
  }
  notesStore.fetchNotes(true)
})

async function clearFilter() {
  router.replace({ path: '/', query: {} })
  notesStore.filterByTag(null)
  notesStore.fetchNotes(true)
}

async function handleCreate(content: string, files: File[]) {
  await notesStore.createNoteWithAttachments(content, files)
}

async function handleDelete(id: string) {
  if (confirm('确定删除这条笔记吗？')) {
    await notesStore.removeNote(id)
  }
}

async function handleUpdate(id: string, content: string, newFiles: File[], removedAttIds: string[]) {
  await notesStore.updateNote(id, content, newFiles, removedAttIds)
}
</script>

<style scoped>
.timeline-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 24px;
  padding-bottom: 48px;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(74, 144, 217, 0.08);
  border-radius: 10px;
  margin-bottom: 20px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--primary-color);
}

.filter-clear {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.15s;
}

.filter-clear:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-color);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--text-secondary);
  gap: 16px;
}

.empty-state p {
  font-size: 15px;
  margin: 0;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 32px;
}

.loading-dots {
  display: flex;
  gap: 6px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-secondary);
  opacity: 0.3;
  animation: pulse 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

.inline-editor {
  margin-top: 16px;
}
</style>
