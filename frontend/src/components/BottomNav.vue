<template>
  <nav class="bottom-nav">
    <router-link to="/">📝 笔记</router-link>
    <router-link to="/tags">🏷️ 标签</router-link>
    <router-link to="/settings">⚙️ 设置</router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
}

.bottom-nav a {
  text-decoration: none;
  font-size: 14px;
  color: var(--text-color);
}
</style>
