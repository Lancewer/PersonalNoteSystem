<template>
  <div class="tag-tree-page">
    <h2 class="page-title">标签管理</h2>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="tags.length === 0" class="empty">还没有标签</div>
    <ul v-else class="tag-list">
      <li v-for="tag in tags" :key="tag.id" class="tag-item">
        <div class="tag-row" @click="handleTagClick(tag)">
          <span class="tag-name">#{{ tag.name }}</span>
          <span v-if="tag.children?.length" class="toggle" @click.stop="toggleTag(tag)">
            {{ expandedTags.has(tag.id) ? '▼' : '▶' }}
          </span>
        </div>
        <ul v-if="expandedTags.has(tag.id) && tag.children?.length" class="tag-children">
          <li v-for="child in tag.children" :key="child.id" class="tag-child-item">
            <span class="tag-name" @click="handleTagClick(child)">#{{ child.name }}</span>
          </li>
        </ul>
      </li>
    </ul>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTags } from '../api/tags'
import type { Tag } from '../types'
import BottomNav from '../components/BottomNav.vue'

const router = useRouter()
const tags = ref<Tag[]>([])
const loading = ref(true)
const expandedTags = ref(new Set<string>())

onMounted(async () => {
  tags.value = await getTags()
  loading.value = false
})

function toggleTag(tag: Tag) {
  if (expandedTags.value.has(tag.id)) {
    expandedTags.value.delete(tag.id)
  } else {
    expandedTags.value.add(tag.id)
  }
}

function handleTagClick(tag: Tag) {
  router.push({ path: '/', query: { tag: tag.id } })
}
</script>

<style scoped>
.tag-tree-page {
  padding: 20px 16px;
  padding-bottom: 80px;
}

.page-title {
  font-size: 20px;
  margin-bottom: 20px;
}

.tag-list {
  list-style: none;
}

.tag-item {
  margin-bottom: 8px;
}

.tag-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--card-bg);
  border-radius: 8px;
  cursor: pointer;
}

.tag-name {
  font-size: 15px;
  color: var(--primary-color);
}

.toggle {
  font-size: 12px;
  color: var(--text-secondary);
}

.tag-children {
  list-style: none;
  margin-left: 20px;
  margin-top: 4px;
}

.tag-child-item {
  padding: 8px 12px;
}

.loading, .empty {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px;
}
</style>
