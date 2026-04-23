<template>
  <div class="note-editor">
    <textarea
      v-model="content"
      placeholder="记录你的想法... 使用 #标签 分类"
      rows="2"
      @keydown.enter.ctrl="handleSubmit"
    ></textarea>
    <div class="editor-toolbar">
      <label class="toolbar-btn" title="上传图片">
        📷
        <input type="file" accept="image/*" @change="handleImageUpload" hidden />
      </label>
      <span class="char-count">{{ content.length }}</span>
      <button class="submit-btn" :disabled="!content.trim()" @click="handleSubmit">
        发送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  submit: [content: string]
}>()

const content = ref('')

function handleSubmit() {
  if (!content.value.trim()) return
  emit('submit', content.value)
  content.value = ''
}

function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    content.value += ` [图片待上传] `
  }
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
