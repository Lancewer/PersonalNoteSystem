<template>
  <Teleport to="body">
    <div v-if="modelValue" class="search-page-overlay" role="dialog" aria-modal="true" @click="close">
      <div class="search-page" @click.stop>
        <div class="search-bar">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref="searchInput"
            class="search-input"
            type="text"
            placeholder="搜索"
            :value="notesStore.searchQuery"
            @input="handleInput"
          />
          <button class="search-close-btn" aria-label="关闭搜索" @click="close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <div class="quick-filters">
          <span class="filters-label">快捷搜索</span>
          <div class="filter-tags">
            <button class="filter-tag" type="button" disabled>无标签</button>
            <button class="filter-tag" type="button" disabled>有链接</button>
            <button class="filter-tag" type="button" disabled>有图片</button>
            <button class="filter-tag" type="button" disabled>有语音</button>
            <button class="filter-tag" type="button" disabled>那年今日</button>
          </div>
        </div>

        <div class="search-results">
          <NoteCard
            v-for="note in notesStore.filteredNotes"
            :key="note.id"
            :note="note"
            @delete="$emit('note-delete', $event)"
            @update="$emit('note-update', $event)"
          />
          <div v-if="notesStore.filteredNotes.length === 0 && notesStore.searchQuery" class="no-results">
            <p>没有找到匹配的笔记</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useNotesStore } from '../stores/notes'
import NoteCard from './NoteCard.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'note-delete': [id: string]
  'note-update': [id: string, content: string, files: File[], removedIds: string[]]
}>()

const notesStore = useNotesStore()
const searchInput = ref<HTMLInputElement | null>(null)

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.modelValue) {
    close()
  }
}

watch(() => props.modelValue, async (val) => {
  if (val) {
    await nextTick()
    searchInput.value?.focus()
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})

function close() {
  notesStore.clearSearch()
  emit('update:modelValue', false)
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  notesStore.searchQuery = target.value
}
</script>

<style scoped>
.search-page-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-color);
  z-index: 200;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.search-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-color);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
}

.search-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 16px;
  color: var(--text-color);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-close-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  border: none;
  border-radius: 50%;
  color: var(--text-secondary);
  cursor: pointer;
  flex-shrink: 0;
}

.search-close-btn:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.quick-filters {
  padding: 16px;
}

.filters-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  padding: 8px 14px;
  background: var(--card-bg);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
  transition: background-color 0.15s;
  border: none;
}

.filter-tag:hover {
  background: var(--bg-color);
}

.filter-tag:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 1px;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
}

.no-results {
  display: flex;
  justify-content: center;
  padding: 60px 0;
  color: var(--text-secondary);
}
</style>
