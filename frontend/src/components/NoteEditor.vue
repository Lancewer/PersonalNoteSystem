<template>
  <div class="note-editor">
    <textarea
      v-model="content"
      placeholder="记录你的想法... 使用 #标签 分类"
      rows="2"
      @keydown.enter.ctrl="handleSubmit"
    ></textarea>
    <div v-if="pendingFiles.length" class="file-preview">
      <div v-for="(file, index) in pendingFiles" :key="index" class="file-item">
        <img v-if="file.type.startsWith('image/')" :src="getFileUrl(file)" class="preview-thumb" />
        <span class="file-name">{{ file.name }}</span>
        <button class="remove-file" @click="removeFile(index)">×</button>
      </div>
    </div>
    <div class="editor-toolbar">
      <label class="toolbar-btn" title="上传图片">
        📷
        <input type="file" accept="image/*" multiple @change="handleImageUpload" hidden />
      </label>
      <span class="char-count">{{ content.length }}</span>
      <button class="submit-btn" :disabled="!content.trim() && pendingFiles.length === 0" @click="handleSubmit">
        发送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  submit: [content: string, files: File[]]
}>()

const content = ref('')
const pendingFiles = ref<File[]>([])

function handleSubmit() {
  if (!content.value.trim() && pendingFiles.value.length === 0) return
  emit('submit', content.value, [...pendingFiles.value])
  content.value = ''
  pendingFiles.value = []
}

function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) {
    pendingFiles.value.push(...Array.from(input.files))
  }
  input.value = ''
}

function removeFile(index: number) {
  pendingFiles.value.splice(index, 1)
}

function getFileUrl(file: File): string {
  return URL.createObjectURL(file)
}
</script>

<style scoped>
.note-editor {
  position: fixed;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 768px;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
  padding: 12px 16px;
  z-index: 100;
}

.note-editor textarea {
  width: 100%;
  border: none;
  resize: none;
  font-size: 15px;
  line-height: 1.6;
  outline: none;
  background: transparent;
}

.file-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.file-item {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-color);
  border-radius: 8px;
  padding: 4px;
}

.preview-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
}

.file-name {
  font-size: 12px;
  color: var(--text-secondary);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-file {
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

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

.toolbar-btn {
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
}

.char-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.submit-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  min-height: 44px;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
