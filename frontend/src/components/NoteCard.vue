<template>
  <div class="note-card">
    <template v-if="!isEditing">
      <p class="note-content" v-html="renderedContent"></p>
      <div v-if="note.tags.length" class="note-tags">
        <span v-for="tag in note.tags" :key="tag.id" class="tag">
          {{ tag.name }}
        </span>
      </div>
      <div v-if="imageAttachments.length" class="note-attachments">
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
      <div v-if="editAttachments.length" class="edit-image-grid">
        <div v-for="(att, index) in editAttachments" :key="att.id || index" class="edit-image-item">
          <img :src="getEditImageUrl(att)" class="edit-thumb" />
          <button class="remove-img-btn" @click="removeEditImage(index)">×</button>
        </div>
      </div>
      <div v-if="pendingFiles.length" class="pending-files">
        <span class="pending-label">待上传图片：</span>
        <div v-for="(file, index) in pendingFiles" :key="index" class="pending-item">
          <img v-if="file.type.startsWith('image/')" :src="getFileUrl(file)" class="pending-thumb" />
          <span class="pending-name">{{ file.name }}</span>
          <button class="remove-pending" @click="removePendingFile(index)">×</button>
        </div>
      </div>
      <div class="edit-actions">
        <label class="add-image-btn" title="添加图片">
          📷 添加图片
          <input type="file" accept="image/*" multiple @change="handleImageUpload" hidden />
        </label>
        <div class="action-buttons">
          <button class="cancel-btn" @click="cancelEdit">取消</button>
          <button class="save-btn" @click="saveEdit">保存</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { Note, Attachment } from '../types'

const props = defineProps<{
  note: Note
}>()

const emit = defineEmits<{
  delete: [id: string]
  update: [id: string, content: string, newFiles: File[], removedAttIds: string[]]
}>()

const token = localStorage.getItem('token')
const isEditing = ref(false)
const editContent = ref('')
const editTextarea = ref<HTMLTextAreaElement | null>(null)
const editAttachments = ref<Attachment[]>([])
const removedAttIds = ref<string[]>([])
const pendingFiles = ref<File[]>([])

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

function getEditImageUrl(att: Attachment | File): string {
  if ('id' in att) {
    return `/api/attachments/${att.id}?token=${token}`
  }
  return URL.createObjectURL(att as File)
}

function getFileUrl(file: File): string {
  return URL.createObjectURL(file)
}

async function startEdit() {
  editContent.value = props.note.content
  editAttachments.value = [...props.note.attachments]
  removedAttIds.value = []
  pendingFiles.value = []
  isEditing.value = true
  await nextTick()
  editTextarea.value?.focus()
}

function cancelEdit() {
  isEditing.value = false
  editContent.value = ''
  editAttachments.value = []
  removedAttIds.value = []
  pendingFiles.value = []
}

function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) {
    pendingFiles.value.push(...Array.from(input.files))
  }
  input.value = ''
}

function removeEditImage(index: number) {
  const att = editAttachments.value[index]
  if ('id' in att) {
    removedAttIds.value.push(att.id)
  }
  editAttachments.value.splice(index, 1)
}

function removePendingFile(index: number) {
  pendingFiles.value.splice(index, 1)
}

function saveEdit() {
  emit('update', props.note.id, editContent.value, [...pendingFiles.value], [...removedAttIds.value])
  isEditing.value = false
  editContent.value = ''
  editAttachments.value = []
  removedAttIds.value = []
  pendingFiles.value = []
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

.note-attachments {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-image {
  max-width: 100%;
  border-radius: 8px;
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

.edit-image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.edit-image-item {
  position: relative;
  display: inline-block;
}

.edit-thumb {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
}

.remove-img-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e74c3c;
  color: white;
  border: none;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.pending-files {
  margin-top: 10px;
  padding: 8px;
  background: var(--bg-color);
  border-radius: 8px;
}

.pending-label {
  font-size: 12px;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 6px;
}

.pending-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 8px;
  margin-bottom: 4px;
}

.pending-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.pending-name {
  font-size: 11px;
  color: var(--text-secondary);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-pending {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e74c3c;
  color: white;
  border: none;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.edit-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

.add-image-btn {
  font-size: 13px;
  color: var(--primary-color);
  cursor: pointer;
  padding: 4px 8px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}
</style>
