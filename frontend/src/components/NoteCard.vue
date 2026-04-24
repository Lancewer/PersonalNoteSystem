<template>
  <div class="note-card">
    <p class="note-content" v-html="renderedContent"></p>
    <div v-if="note.tags.length" class="note-tags">
      <span v-for="tag in note.tags" :key="tag.id" class="tag">
        {{ tag.name }}
      </span>
    </div>
    <div v-if="note.attachments.length" class="note-attachments">
      <img
        v-for="att in imageAttachments"
        :key="att.id"
        :src="getImageUrl(att.id)"
        class="attachment-image"
        loading="lazy"
      />
    </div>
    <div class="note-footer">
      <span class="note-time">{{ formatTime(note.created_at) }}</span>
      <button class="delete-btn" @click="$emit('delete', note.id)">删除</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Note } from '../types'

const props = defineProps<{
  note: Note
}>()

defineEmits<{
  delete: [id: string]
}>()

const token = localStorage.getItem('token')

const imageAttachments = computed(() =>
  props.note.attachments.filter(a => a.file_type === 'image')
)

function getImageUrl(attId: string): string {
  return `/api/attachments/${attId}?token=${token}`
}

function renderContent(content: string): string {
  return content.replace(/#([\w\u4e00-\u9fff/]+)/g, '<span class="tag-inline">#$1</span>')
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

const renderedContent = computed(() => renderContent(props.note.content))
</script>

<style scoped>
.note-card {
  background: var(--card-bg);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.note-content {
  font-size: 15px;
  line-height: 1.7;
  margin-bottom: 10px;
  white-space: pre-wrap;
  word-break: break-word;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.tag, .tag-inline {
  color: var(--primary-color);
  font-size: 13px;
}

.attachment-image {
  max-width: 100%;
  border-radius: 8px;
  margin-top: 8px;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

.note-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.delete-btn {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
}
</style>
