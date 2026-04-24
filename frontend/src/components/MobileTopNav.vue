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
  --nav-height: 56px;
  --nav-padding: 16px;
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--nav-height);
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  z-index: 100;
  padding: 0 var(--nav-padding);
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

.hamburger-btn:focus-visible,
.search-btn:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.brand-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-color);
}
</style>
