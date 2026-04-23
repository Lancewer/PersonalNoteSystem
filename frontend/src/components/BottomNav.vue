<template>
  <nav class="bottom-nav">
    <router-link to="/" class="nav-item" active-class="active">
      <span class="nav-icon">📝</span>
      <span class="nav-label">笔记</span>
    </router-link>
    <router-link to="/tags" class="nav-item" active-class="active">
      <span class="nav-icon">🏷️</span>
      <span class="nav-label">标签</span>
    </router-link>
    <router-link to="/settings" class="nav-item" active-class="active">
      <span class="nav-icon">⚙️</span>
      <span class="nav-label">设置</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 768px;
  display: flex;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
  z-index: 100;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  text-decoration: none;
  color: var(--text-secondary);
  transition: color 0.2s;
  min-height: 60px;
}

.nav-item.active {
  color: var(--primary-color);
}

.nav-icon {
  font-size: 22px;
}

.nav-label {
  font-size: 11px;
  margin-top: 2px;
}
</style>
