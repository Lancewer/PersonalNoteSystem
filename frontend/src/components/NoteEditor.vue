<template>
  <div class="note-editor">
    <textarea placeholder="记录你的想法..."></textarea>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  submit: [content: string]
}>()
</script>

<style scoped>
.note-editor {
  position: fixed;
  bottom: 60px;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
}

.note-editor textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  resize: none;
  font-size: 14px;
  background: var(--input-bg);
  color: var(--text-color);
}
</style>
