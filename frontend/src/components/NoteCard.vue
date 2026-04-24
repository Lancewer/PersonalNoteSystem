<template>
  <div class="note-card">
    <!-- View/Edit Mode -->
    <template v-if="!isEditing">
      <div class="note-card-body" @click="toggleExpand">
        <p :class="['note-content', { 'note-content-truncated': isTruncated && !isExpanded }]">
          {{ note.content }}
        </p>
        <p v-if="isTruncated && !isExpanded" class="note-expand-hint">点击展开</p>
      </div>
      <div v-if="note.tags.length" class="note-tags">
        <span v-for="tag in note.tags" :key="tag.id" class="note-tag">
          #{{ tag.name }}
        </span>
      </div>
      <div v-if="imageAttachments.length" class="note-attachments">
        <img
          v-for="att in imageAttachments"
          :key="att.id"
          :src="getImageUrl(att.id)"
          class="note-attachment-thumb"
          loading="lazy"
          @click.stop="openImageModal(att.id)"
        />
      </div>
      <div class="note-footer">
        <span class="note-time">{{ displayTime(note.created_at) }}</span>
        <div class="note-actions">
          <button class="note-action-btn" @click.stop="startEdit" title="编辑">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              <path d="m15 5 4 4"/>
            </svg>
          </button>
          <button class="note-action-btn note-action-btn--danger" @click.stop="handleDelete" title="删除">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </template>

    <!-- Edit Mode -->
    <template v-else>
      <textarea
        v-model="editContent"
        class="note-edit-textarea"
        rows="8"
        ref="editTextarea"
        @click.stop
      ></textarea>
      <div v-if="editAttachments.length" class="note-edit-images">
        <div v-for="(att, index) in editAttachments" :key="att.id || index" class="note-edit-image-item">
          <img :src="getEditImageUrl(att)" class="note-edit-image-thumb" />
          <button class="note-edit-remove-btn" @click="removeEditImage(index)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <div v-if="pendingFiles.length" class="note-edit-pending">
        <span class="note-edit-pending-label">待上传：</span>
        <div v-for="(file, index) in pendingFiles" :key="index" class="note-edit-pending-item">
          <span class="note-edit-pending-name">{{ file.name }}</span>
          <button class="note-edit-pending-remove" @click="removePendingFile(index)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="note-edit-footer">
        <label class="note-edit-upload" title="添加图片">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
          <input type="file" accept="image/*" multiple @change="handleImageUpload" hidden />
        </label>
        <div class="note-edit-actions">
          <button class="note-edit-cancel" @click="cancelEdit">取消</button>
          <button class="note-edit-save" :disabled="!editContent.trim()" @click="saveEdit">保存</button>
        </div>
      </div>
    </template>

    <!-- Image Modal -->
    <Teleport to="body">
      <div v-if="showImageModal" class="note-image-modal" @click="closeImageModal">
        <div class="note-image-modal-content" @click.stop>
          <img :src="getImageUrl(currentViewImage)" class="note-image-modal-full" />
          <button class="note-image-modal-close" @click="closeImageModal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { Note, Attachment } from '../types'
import { formatRelativeTime } from '../utils/time'
import { useSettingsStore } from '../stores/settings'

const settingsStore = useSettingsStore()

const props = defineProps<{
  note: Note
}>()

const emit = defineEmits<{
  delete: [id: string]
  update: [id: string, content: string, newFiles: File[], removedAttIds: string[]]
}>()

const token = localStorage.getItem('token')
const isEditing = ref(false)
const isExpanded = ref(false)
const editContent = ref('')
const editTextarea = ref<HTMLTextAreaElement | null>(null)
const editAttachments = ref<Attachment[]>([])
const removedAttIds = ref<string[]>([])
const pendingFiles = ref<File[]>([])
const showImageModal = ref(false)
const currentViewImage = ref('')

const MAX_PREVIEW_CHARS = 120

const imageAttachments = computed(() =>
  props.note.attachments.filter(a => a.file_type === 'image')
)

const isTruncated = computed(() => props.note.content.length > MAX_PREVIEW_CHARS)

function getImageUrl(attId: string): string {
  return `/api/attachments/${attId}?token=${token}`
}

function getEditImageUrl(att: Attachment | File): string {
  if ('id' in att) {
    return `/api/attachments/${att.id}?token=${token}`
  }
  return URL.createObjectURL(att as File)
}

function displayTime(dateStr: string): string {
  return formatRelativeTime(dateStr, settingsStore.timezone)
}

function toggleExpand() {
  if (isEditing.value) return
  if (isTruncated.value) {
    isExpanded.value = !isExpanded.value
  }
}

function handleDelete() {
  emit('delete', props.note.id)
}

async function startEdit() {
  isExpanded.value = false
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

function openImageModal(attId: string) {
  currentViewImage.value = attId
  showImageModal.value = true
  document.body.style.overflow = 'hidden'
}

function closeImageModal() {
  showImageModal.value = false
  currentViewImage.value = ''
  document.body.style.overflow = ''
}
</script>

<style scoped>
.note-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  transition: background-color 0.2s, box-shadow 0.2s;
}

.note-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.note-card:active {
  transform: scale(0.995);
}

.note-card-body {
  margin-bottom: 12px;
  cursor: pointer;
}

.note-content {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-color);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  transition: all 0.25s ease;
}

.note-content-truncated {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-expand-hint {
  font-size: 12px;
  color: var(--primary-color);
  margin-top: 8px;
  margin-bottom: 0;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.note-tag {
  font-size: 13px;
  color: var(--primary-color);
  background: rgba(74, 144, 217, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
}

.note-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.note-attachment-thumb {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
}

.note-attachment-thumb:hover {
  transform: scale(1.03);
  opacity: 0.85;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.note-time {
  font-size: 12px;
  color: var(--text-secondary);
}

.note-actions {
  display: flex;
  gap: 4px;
}

.note-action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.note-action-btn:hover {
  background: var(--bg-color);
  color: var(--text-color);
}

.note-action-btn:active {
  transform: scale(0.92);
}

.note-action-btn--danger {
  color: var(--text-secondary);
}

.note-action-btn--danger:hover {
  background: rgba(231, 76, 60, 0.08);
  color: #e74c3c;
}

/* Edit Mode */
.note-edit-textarea {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 12px;
  font-size: 15px;
  line-height: 1.6;
  font-family: inherit;
  resize: vertical;
  outline: none;
  background: var(--bg-color);
}

.note-edit-textarea:focus {
  border-color: var(--primary-color);
}

.note-edit-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.note-edit-image-item {
  position: relative;
  display: inline-block;
}

.note-edit-image-thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
}

.note-edit-remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e74c3c;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.note-edit-pending {
  margin-top: 12px;
  padding: 10px 12px;
  background: var(--bg-color);
  border-radius: 8px;
}

.note-edit-pending-label {
  font-size: 12px;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 6px;
}

.note-edit-pending-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: 8px;
  margin-bottom: 4px;
  padding: 4px 8px;
  background: var(--card-bg);
  border-radius: 6px;
}

.note-edit-pending-name {
  font-size: 12px;
  color: var(--text-color);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-edit-pending-remove {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.note-edit-pending-remove:hover {
  color: #e74c3c;
}

.note-edit-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.note-edit-upload {
  display: flex;
  align-items: center;
  color: var(--primary-color);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: background-color 0.15s;
}

.note-edit-upload:hover {
  background: rgba(74, 144, 217, 0.08);
}

.note-edit-actions {
  display: flex;
  gap: 8px;
}

.note-edit-cancel,
.note-edit-save {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  min-height: 36px;
}

.note-edit-cancel {
  background: var(--bg-color);
  color: var(--text-secondary);
}

.note-edit-save {
  background: var(--primary-color);
  color: white;
}

.note-edit-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Image Modal */
.note-image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.note-image-modal-content {
  position: relative;
  max-width: 95vw;
  max-height: 95vh;
}

.note-image-modal-full {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
}

.note-image-modal-close {
  position: absolute;
  top: -48px;
  right: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.note-image-modal-close:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>
