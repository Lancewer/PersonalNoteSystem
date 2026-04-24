<template>
  <AppLayout>
    <div class="timeline-container">
      <div v-if="notesStore.notes.length === 0 && !notesStore.loading" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        <p>还没有笔记，在下方开始记录你的想法</p>
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
import { onMounted } from 'vue'
import { useNotesStore } from '../stores/notes'
import NoteCard from '../components/NoteCard.vue'
import NoteEditor from '../components/NoteEditor.vue'
import AppLayout from '../components/AppLayout.vue'

const notesStore = useNotesStore()

onMounted(() => {
  notesStore.fetchNotes(true)
})

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
