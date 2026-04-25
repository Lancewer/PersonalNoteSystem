<template>
  <AppLayout>
    <div class="tag-tree-container">
      <h2 class="page-title">标签管理</h2>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="tags.length === 0" class="empty">还没有标签</div>
      <ul v-else class="tag-list">
        <TagNode
          v-for="tag in tags"
          :key="tag.id"
          :tag="tag"
          @tag-click="handleTagClick"
        />
      </ul>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTags } from '../api/tags'
import type { Tag } from '../types'
import AppLayout from '../components/AppLayout.vue'
import TagNode from '../components/TagNode.vue'

const router = useRouter()
const tags = ref<Tag[]>([])
const loading = ref(true)

onMounted(async () => {
  tags.value = await getTags()
  loading.value = false
})

function handleTagClick(tag: Tag) {
  router.push({ path: '/', query: { tag: tag.id } })
}
</script>

<style scoped>
.tag-tree-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 24px;
}

@media (max-width: 768px) {
  .tag-tree-container {
    padding: 16px;
  }
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-color);
}

.tag-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.loading, .empty {
  text-align: center;
  color: var(--text-secondary);
  padding: 60px 20px;
  font-size: 15px;
}
</style>
