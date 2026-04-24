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
    <aside class="sidebar-drawer" :class="{ 'drawer-open': drawerOpen }" aria-label="侧边栏导航">
      <div class="sidebar-header">
        <h1 class="sidebar-title">笔记</h1>
      </div>
      <SidebarNav @nav-click="drawerOpen = false" />
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
      <SidebarNav />
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotesStore } from '../stores/notes'
import MobileTopNav from './MobileTopNav.vue'
import SidebarNav from './SidebarNav.vue'

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

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && drawerOpen.value) {
    drawerOpen.value = false
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
/* 
  z-index hierarchy:
  10  - desktop-sidebar
  100 - mobile-top-nav
  140 - drawer-overlay
  150 - sidebar-drawer
  200 - search-page (SearchPage.vue)
*/

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
