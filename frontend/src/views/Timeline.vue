<template>
  <div class="timeline">
    <div v-if="notesStore.notes.length === 0 && !notesStore.loading" class="empty-state">
      <p>还没有笔记，开始记录你的想法吧</p>
    </div>
    <NoteCard
      v-for="note in notesStore.notes"
      :key="note.id"
      :note="note"
      @delete="handleDelete"
      @update="handleUpdate"
    />
    <div v-if="notesStore.loading" class="loading">加载中...</div>
    <NoteEditor @submit="handleCreate" />
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useNotesStore } from '../stores/notes'
import NoteCard from '../components/NoteCard.vue'
import NoteEditor from '../components/NoteEditor.vue'
import BottomNav from '../components/BottomNav.vue'

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

async function handleUpdate(id: string, content: string) {
  await notesStore.updateNote(id, content)
}
</script>

<style scoped>
.timeline {
  padding: 16px;
  padding-bottom: 120px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.loading {
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
}
</style>
