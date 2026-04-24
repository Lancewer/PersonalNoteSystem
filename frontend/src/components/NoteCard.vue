<template>
  <div class="note-card">
    <template v-if="!isEditing">
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
        <div class="note-actions">
          <button class="edit-btn" @click="startEdit">编辑</button>
          <button class="delete-btn" @click="$emit('delete', note.id)">删除</button>
        </div>
      </div>
    </template>
    <template v-else>
      <textarea
        v-model="editContent"
        class="edit-textarea"
        rows="4"
        ref="editTextarea"
      ></textarea>
      <div class="edit-actions">
        <button class="cancel-btn" @click="cancelEdit">取消</button>
        <button class="save-btn" :disabled="!editContent.trim()" @click="saveEdit">保存</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { Note } from '../types'

const props = defineProps<{
  note: Note
}>()

const emit = defineEmits<{
  delete: [id: string]
  update: [id: string, content: string]
}>()

const token = localStorage.getItem('token')
const isEditing = ref(false)
const editContent = ref('')
const editTextarea = ref<HTMLTextAreaElement | null>(null)

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

async function startEdit() {
  editContent.value = props.note.content
  isEditing.value = true
  await nextTick()
  editTextarea.value?.focus()
}

function cancelEdit() {
  isEditing.value = false
  editContent.value = ''
}

function saveEdit() {
  if (!editContent.value.trim()) return
  emit('update', props.note.id, editContent.value)
  isEditing.value = false
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

.note-actions {
  display: flex;
  gap: 8px;
}

.note-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.edit-btn, .delete-btn, .cancel-btn, .save-btn {
  background: none;
  border: none;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
}

.edit-btn {
  color: var(--primary-color);
}

.delete-btn {
  color: #e74c3c;
}

.cancel-btn {
  color: var(--text-secondary);
}

.save-btn {
  color: var(--primary-color);
  font-weight: 500;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.edit-textarea {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px;
  font-size: 15px;
  line-height: 1.6;
  font-family: inherit;
  resize: vertical;
  outline: none;
}

.edit-textarea:focus {
  border-color: var(--primary-color);
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
}
</style>
