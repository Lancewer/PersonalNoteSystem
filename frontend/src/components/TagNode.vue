<template>
  <li class="tag-item">
    <div class="tag-row" @click="handleTagClick">
      <div class="tag-info">
        <span class="tag-name">#{{ tag.name }}</span>
        <span v-if="tag.note_count !== undefined" class="note-count">{{ tag.note_count }}</span>
      </div>
      <span v-if="tag.children?.length" class="toggle" @click.stop="toggleExpand">
        {{ isExpanded ? '▼' : '▶' }}
      </span>
    </div>
    <ul v-if="isExpanded && tag.children?.length" class="tag-children">
      <TagNode
        v-for="child in tag.children"
        :key="child.id"
        :tag="child"
        @tag-click="$emit('tag-click', $event)"
      />
    </ul>
  </li>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Tag } from '../types'

defineOptions({
  name: 'TagNode'
})

const props = defineProps<{
  tag: Tag
}>()

const emit = defineEmits<{
  'tag-click': [tag: Tag]
}>()

const isExpanded = ref(false)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function handleTagClick() {
  emit('tag-click', props.tag)
}
</script>

<style scoped>
.tag-item {
  margin-bottom: 8px;
}

.tag-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: var(--card-bg);
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.tag-row:hover {
  background: var(--bg-color);
}

.tag-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-name {
  font-size: 15px;
  color: var(--primary-color);
}

.note-count {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-color);
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.toggle {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px;
}

.tag-children {
  list-style: none;
  margin-left: 20px;
  margin-top: 4px;
  padding: 0;
}
</style>
