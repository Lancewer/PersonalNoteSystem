# 移动端布局重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 参考 Flomo 实现移动端抽屉式侧边栏和独立搜索页面，桌面端保持不变。

**Architecture:** 通过响应式断点（768px）区分桌面端和移动端。桌面端保持固定侧边栏；移动端显示顶部导航栏（汉堡菜单+搜索按钮），点击汉堡菜单滑出抽屉侧边栏，点击搜索按钮滑入独立搜索页面。

**Tech Stack:** Vue 3 + TypeScript + Pinia + CSS Transitions

---

## File Structure

### New Files
- `frontend/src/components/MobileTopNav.vue` - 移动端顶部导航栏（汉堡菜单 + 品牌名 + 搜索按钮）
- `frontend/src/components/SearchPage.vue` - 移动端独立搜索页面
- `frontend/src/components/MobileTopNav.test.ts` - 顶部导航栏测试
- `frontend/src/components/SearchPage.test.ts` - 搜索页面测试

### Modified Files
- `frontend/src/components/AppLayout.vue` - 添加抽屉逻辑、遮罩层、响应式侧边栏分离
- `frontend/src/views/Timeline.vue` - 集成 MobileTopNav 和 SearchPage 组件
- `frontend/src/stores/notes.ts` - 添加 `clearSearch()` 方法
- `frontend/src/components/AppLayout.test.ts` - 更新测试适配新逻辑

---

### Task 1: MobileTopNav 组件

**Files:**
- Create: `frontend/src/components/MobileTopNav.vue`
- Test: `frontend/src/components/MobileTopNav.test.ts`

- [ ] **Step 1: 编写测试**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MobileTopNav from './MobileTopNav.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('MobileTopNav', () => {
  it('should render hamburger menu button', () => {
    const wrapper = mount(MobileTopNav, {
      props: { showSearch: false, showDrawer: false }
    })
    expect(wrapper.find('.hamburger-btn').exists()).toBe(true)
  })

  it('should render brand title', () => {
    const wrapper = mount(MobileTopNav, {
      props: { showSearch: false, showDrawer: false }
    })
    expect(wrapper.find('.brand-title').text()).toBe('笔记')
  })

  it('should render search button', () => {
    const wrapper = mount(MobileTopNav, {
      props: { showSearch: false, showDrawer: false }
    })
    expect(wrapper.find('.search-btn').exists()).toBe(true)
  })

  it('should emit menu-toggle when hamburger clicked', async () => {
    const wrapper = mount(MobileTopNav, {
      props: { showSearch: false, showDrawer: false }
    })
    await wrapper.find('.hamburger-btn').trigger('click')
    expect(wrapper.emitted('menu-toggle')).toBeTruthy()
  })

  it('should emit search-open when search clicked', async () => {
    const wrapper = mount(MobileTopNav, {
      props: { showSearch: false, showDrawer: false }
    })
    await wrapper.find('.search-btn').trigger('click')
    expect(wrapper.emitted('search-open')).toBeTruthy()
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd frontend && npm test -- src/components/MobileTopNav.test.ts
```
预期：FAIL（组件不存在）

- [ ] **Step 3: 实现组件**

```vue
<template>
  <header class="mobile-top-nav">
    <button class="hamburger-btn" aria-label="打开菜单" @click="$emit('menu-toggle')">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    </button>
    <span class="brand-title">笔记</span>
    <button class="search-btn" aria-label="搜索笔记" @click="$emit('search-open')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    </button>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  'menu-toggle': []
  'search-open': []
}>()
</script>

<style scoped>
.mobile-top-nav {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  z-index: 100;
  padding: 0 16px;
  align-items: center;
  justify-content: space-between;
}

@media (max-width: 768px) {
  .mobile-top-nav {
    display: flex;
  }
}

.hamburger-btn,
.search-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.15s;
}

.hamburger-btn:hover,
.search-btn:hover {
  background: var(--bg-color);
}

.brand-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-color);
}
</style>
```

- [ ] **Step 4: 运行测试验证通过**

```bash
cd frontend && npm test -- src/components/MobileTopNav.test.ts
```
预期：PASS (5 tests)

- [ ] **Step 5: 提交**

```bash
git add frontend/src/components/MobileTopNav.vue frontend/src/components/MobileTopNav.test.ts
git commit -m "feat: add MobileTopNav component for mobile navigation"
```

---

### Task 2: SearchPage 组件

**Files:**
- Create: `frontend/src/components/SearchPage.vue`
- Test: `frontend/src/components/SearchPage.test.ts`

- [ ] **Step 1: 编写测试**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SearchPage from './SearchPage.vue'
import { useNotesStore } from '../stores/notes'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('../api/notes', () => ({
  getNotes: vi.fn(),
  createNote: vi.fn(),
  deleteNote: vi.fn(),
  uploadAttachment: vi.fn(),
  updateNote: vi.fn(),
  deleteAttachment: vi.fn(),
}))

vi.mock('../api/tags', () => ({
  getNotesByTag: vi.fn(),
  getTags: vi.fn(),
  createTag: vi.fn(),
}))

describe('SearchPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should render search input with auto-focus', () => {
    const wrapper = mount(SearchPage, {
      props: { modelValue: true }
    })
    expect(wrapper.find('.search-input').exists()).toBe(true)
  })

  it('should emit close when close button clicked', async () => {
    const wrapper = mount(SearchPage, {
      props: { modelValue: true }
    })
    await wrapper.find('.search-close-btn').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
  })

  it('should update store searchQuery when typing', async () => {
    const wrapper = mount(SearchPage, {
      props: { modelValue: true }
    })
    const store = useNotesStore()
    const input = wrapper.find('.search-input')
    await input.setValue('test')
    expect(store.searchQuery).toBe('test')
  })

  it('should render quick filter tags', () => {
    const wrapper = mount(SearchPage, {
      props: { modelValue: true }
    })
    expect(wrapper.find('.quick-filters').exists()).toBe(true)
    expect(wrapper.findAll('.filter-tag')).toHaveLength(5)
  })
})
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd frontend && npm test -- src/components/SearchPage.test.ts
```
预期：FAIL（组件不存在）

- [ ] **Step 3: 实现组件**

```vue
<template>
  <Teleport to="body">
    <div v-if="modelValue" class="search-page-overlay" @click="close">
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
            <span class="filter-tag">无标签</span>
            <span class="filter-tag">有链接</span>
            <span class="filter-tag">有图片</span>
            <span class="filter-tag">有语音</span>
            <span class="filter-tag">那年今日</span>
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

defineEmits<{
  'update:modelValue': [value: boolean]
  'note-delete': [id: string]
  'note-update': [id: string, content: string, files: File[], removedIds: string[]]
}>()

const notesStore = useNotesStore()
const searchInput = ref<HTMLInputElement | null>(null)

watch(() => props.modelValue, async (val) => {
  if (val) {
    await nextTick()
    searchInput.value?.focus()
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

@keyframes slideOut {
  from { transform: translateX(0); }
  to { transform: translateX(100%); }
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
  width: 36px;
  height: 36px;
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
}

.filter-tag:hover {
  background: var(--bg-color);
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
```

- [ ] **Step 4: 添加 clearSearch 方法到 Store**

修改 `frontend/src/stores/notes.ts`:

```typescript
// 在 return 语句前添加
function clearSearch() {
  searchQuery.value = ''
}

// 更新 return 语句
return {
  notes, loading, hasMore, activeTagId, searchQuery, filteredNotes,
  fetchNotes, createNote, createNoteWithAttachments, updateNote,
  removeAttachment, removeNote, setFilterTag, clearSearch
}
```

- [ ] **Step 5: 编写 clearSearch 测试**

在 `frontend/src/stores/notes.search.test.ts` 中添加:

```typescript
it('should clear search query', () => {
  const store = useNotesStore()
  store.searchQuery = 'test'
  store.clearSearch()
  expect(store.searchQuery).toBe('')
})
```

- [ ] **Step 6: 运行测试验证通过**

```bash
cd frontend && npm test -- src/components/SearchPage.test.ts src/stores/notes.search.test.ts
```
预期：PASS

- [ ] **Step 7: 提交**

```bash
git add frontend/src/components/SearchPage.vue frontend/src/components/SearchPage.test.ts frontend/src/stores/notes.ts frontend/src/stores/notes.search.test.ts
git commit -m "feat: add SearchPage component and clearSearch method"
```

---

### Task 3: AppLayout 抽屉逻辑

**Files:**
- Modify: `frontend/src/components/AppLayout.vue`
- Test: `frontend/src/components/AppLayout.test.ts`

- [ ] **Step 1: 更新测试适配抽屉逻辑**

修改 `frontend/src/components/AppLayout.test.ts`:

```typescript
// 添加抽屉相关测试
describe('mobile drawer', () => {
  it('should open drawer when hamburger clicked', async () => {
    const wrapper = mount(AppLayout, {
      slots: { default: '<div>Content</div>' }
    })
    // 模拟移动端
    window.innerWidth = 500
    window.dispatchEvent(new Event('resize'))
    await wrapper.vm.$nextTick()

    const hamburger = wrapper.find('.hamburger-btn')
    await hamburger.trigger('click')
    expect(wrapper.find('.sidebar-drawer').classes()).toContain('drawer-open')
  })

  it('should close drawer when overlay clicked', async () => {
    const wrapper = mount(AppLayout, {
      slots: { default: '<div>Content</div>' }
    })
    window.innerWidth = 500
    window.dispatchEvent(new Event('resize'))
    await wrapper.vm.$nextTick()

    await wrapper.find('.hamburger-btn').trigger('click')
    await wrapper.find('.drawer-overlay').trigger('click')
    expect(wrapper.find('.sidebar-drawer').classes()).not.toContain('drawer-open')
  })
})
```

- [ ] **Step 2: 修改 AppLayout 模板**

```vue
<template>
  <div class="app-layout">
    <!-- Mobile Top Navigation -->
    <MobileTopNav
      @menu-toggle="drawerOpen = true"
      @search-open="$emit('search-open')"
    />

    <!-- Mobile Drawer Overlay -->
    <div
      v-if="drawerOpen"
      class="drawer-overlay"
      @click="drawerOpen = false"
    ></div>

    <!-- Mobile Sidebar Drawer -->
    <aside class="sidebar-drawer" :class="{ 'drawer-open': drawerOpen }">
      <div class="sidebar-header">
        <h1 class="sidebar-title">笔记</h1>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-link" active-class="active" @click="drawerOpen = false">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <span>全部笔记</span>
        </router-link>
        <router-link to="/tags" class="nav-link" active-class="active" @click="drawerOpen = false">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>
            <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>
          </svg>
          <span>标签</span>
        </router-link>
        <router-link to="/settings" class="nav-link" active-class="active" @click="drawerOpen = false">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>设置</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>
    </aside>

    <!-- Desktop Sidebar (hidden on mobile) -->
    <aside class="desktop-sidebar">
      <div class="sidebar-header">
        <h1 class="sidebar-title">笔记</h1>
      </div>
      <div class="sidebar-search">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          class="sidebar-search-input"
          type="text"
          placeholder="搜索笔记..."
          :value="notesStore.searchQuery"
          @input="handleSearchInput"
        />
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-link" active-class="active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <span>全部笔记</span>
        </router-link>
        <router-link to="/tags" class="nav-link" active-class="active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>
            <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>
          </svg>
          <span>标签</span>
        </router-link>
        <router-link to="/settings" class="nav-link" active-class="active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>设置</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>
    </aside>

    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotesStore } from '../stores/notes'
import MobileTopNav from './MobileTopNav.vue'

defineEmits<{
  'search-open': []
}>()

const router = useRouter()
const authStore = useAuthStore()
const notesStore = useNotesStore()
const drawerOpen = ref(false)

function handleLogout() {
  authStore.doLogout()
  router.push('/login')
}

function handleSearchInput(event: Event) {
  const target = event.target as HTMLInputElement
  notesStore.searchQuery = target.value
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-color);
}

/* Desktop Sidebar - only visible on desktop */
.desktop-sidebar {
  display: none;
}

@media (min-width: 769px) {
  .desktop-sidebar {
    display: flex;
    width: 240px;
    background: var(--card-bg);
    border-right: 1px solid var(--border-color);
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 10;
  }
  
  .app-main {
    margin-left: 240px;
  }
}

/* Mobile Drawer */
.sidebar-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background: var(--card-bg);
  z-index: 150;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.sidebar-drawer.drawer-open {
  transform: translateX(0);
}

@media (min-width: 769px) {
  .sidebar-drawer {
    display: none;
  }
}

.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 140;
  opacity: 0;
  animation: fadeIn 0.3s forwards;
}

@keyframes fadeIn {
  to { opacity: 1; }
}

@media (min-width: 769px) {
  .drawer-overlay {
    display: none;
  }
}

/* Mobile Top Nav spacing */
@media (max-width: 768px) {
  .app-main {
    padding-top: 56px;
  }
}

/* Shared sidebar styles */
.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.sidebar-search {
  position: relative;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.search-icon {
  position: absolute;
  left: 28px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
}

.sidebar-search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.sidebar-search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.1);
}

.sidebar-search-input::placeholder {
  color: var(--text-secondary);
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 15px;
  transition: background-color 0.15s, color 0.15s;
  margin-bottom: 4px;
}

.nav-link:hover {
  background: var(--bg-color);
  color: var(--text-color);
}

.nav-link.active {
  background: rgba(74, 144, 217, 0.1);
  color: var(--primary-color);
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
}

.logout-btn {
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.logout-btn:hover {
  background: rgba(231, 76, 60, 0.08);
  border-color: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}
</style>
```

- [ ] **Step 3: 运行测试验证**

```bash
cd frontend && npm test -- src/components/AppLayout.test.ts
```
预期：PASS

- [ ] **Step 4: 提交**

```bash
git add frontend/src/components/AppLayout.vue frontend/src/components/AppLayout.test.ts
git commit -m "feat: implement mobile drawer sidebar in AppLayout"
```

---

### Task 4: Timeline 集成新组件

**Files:**
- Modify: `frontend/src/views/Timeline.vue`

- [ ] **Step 1: 修改 Timeline 模板**

```vue
<template>
  <AppLayout @search-open="showSearch = true">
    <MobileTopNav
      @menu-toggle="drawerOpen = true"
      @search-open="showSearch = true"
    />
    
    <div class="timeline-container">
      <div v-if="activeTagId" class="filter-bar">
        <span class="filter-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>
            <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>
          </svg>
          标签：#{{ activeTagName }}
        </span>
        <button class="filter-clear" @click="clearFilter">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
          清除
        </button>
      </div>

      <div v-if="notesStore.filteredNotes.length === 0 && !notesStore.loading" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        <p v-if="activeTagId">该标签下还没有笔记</p>
        <p v-else-if="notesStore.searchQuery">没有找到匹配的笔记</p>
        <p v-else>还没有笔记，在下方开始记录你的想法</p>
      </div>

      <NoteCard
        v-for="note in notesStore.filteredNotes"
        :key="note.id"
        :note="note"
        @delete="handleDelete"
        @update="handleUpdate"
      />

      <div v-if="notesStore.loading" class="loading">
        <div class="loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>

      <div class="inline-editor">
        <NoteEditor @submit="handleCreate" />
      </div>
    </div>

    <!-- Mobile Search Page -->
    <SearchPage
      v-model="showSearch"
      @note-delete="handleDelete"
      @note-update="handleUpdate"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotesStore } from '../stores/notes'
import { getTags } from '../api/tags'
import type { Tag } from '../types'
import NoteCard from '../components/NoteCard.vue'
import NoteEditor from '../components/NoteEditor.vue'
import AppLayout from '../components/AppLayout.vue'
import MobileTopNav from '../components/MobileTopNav.vue'
import SearchPage from '../components/SearchPage.vue'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()

const activeTagName = ref('')
const allTags = ref<Tag[]>([])
const showSearch = ref(false)
const drawerOpen = ref(false)

async function loadTags() {
  allTags.value = await getTags()
}

function findTagName(tagId: string): string {
  for (const tag of allTags.value) {
    if (tag.id === tagId) return tag.name
    if (tag.children) {
      const found = findTagNameInChildren(tag.children, tagId)
      if (found) return found
    }
  }
  return ''
}

function findTagNameInChildren(children: Tag[], tagId: string): string | null {
  for (const tag of children) {
    if (tag.id === tagId) return tag.name
    if (tag.children) {
      const found = findTagNameInChildren(tag.children, tagId)
      if (found) return found
    }
  }
  return null
}

const activeTagId = computed(() => notesStore.activeTagId)

onMounted(async () => {
  await loadTags()
  const tagId = route.query.tag as string
  if (tagId) {
    notesStore.setFilterTag(tagId)
    activeTagName.value = findTagName(tagId)
  }
  notesStore.fetchNotes(true)
})

async function clearFilter() {
  notesStore.setFilterTag(null)
  activeTagName.value = ''
  await notesStore.fetchNotes(true)
  router.replace({ path: '/', query: {} })
}

async function handleCreate(content: string, files: File[]) {
  await notesStore.createNoteWithAttachments(content, files)
}

async function handleDelete(id: string) {
  if (confirm('确定删除这条笔记吗？')) {
    await notesStore.removeNote(id)
  }
}

async function handleUpdate(id: string, content: string, newFiles: File[], removedAttIds: string[]) {
  await notesStore.updateNote(id, content, newFiles, removedAttIds)
}
</script>

<style scoped>
/* 保持原有样式不变 */
.timeline-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 24px;
  padding-bottom: 48px;
}

@media (max-width: 768px) {
  .timeline-container {
    padding: 16px;
  }
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(74, 144, 217, 0.08);
  border-radius: 10px;
  margin-bottom: 20px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--primary-color);
}

.filter-clear {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.15s;
}

.filter-clear:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-color);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--text-secondary);
  gap: 16px;
}

.empty-state p {
  font-size: 15px;
  margin: 0;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 32px;
}

.loading-dots {
  display: flex;
  gap: 6px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-secondary);
  opacity: 0.3;
  animation: pulse 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

.inline-editor {
  margin-top: 16px;
}
</style>
```

- [ ] **Step 2: 运行所有测试验证**

```bash
cd frontend && npm test
```
预期：PASS（所有测试通过）

- [ ] **Step 3: 提交**

```bash
git add frontend/src/views/Timeline.vue
git commit -m "feat: integrate MobileTopNav and SearchPage in Timeline"
```

---

### Task 5: 最终验证

- [ ] **Step 1: 运行完整测试套件**

```bash
cd frontend && npm test
```

- [ ] **Step 2: 手动测试检查清单**
- [ ] 桌面端（>768px）：侧边栏固定显示，搜索框在侧边栏内
- [ ] 移动端（≤768px）：显示顶部导航栏
- [ ] 移动端：点击汉堡菜单滑出抽屉
- [ ] 移动端：点击遮罩关闭抽屉
- [ ] 移动端：点击搜索按钮滑入搜索页面
- [ ] 移动端：搜索页面自动聚焦输入框
- [ ] 移动端：输入搜索词实时过滤笔记
- [ ] 移动端：点击关闭按钮返回主页面

- [ ] **Step 3: 最终提交**

```bash
git add .
git commit -m "feat: complete mobile layout refactor with drawer and search page"
```
