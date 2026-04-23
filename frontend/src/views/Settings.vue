<template>
  <div class="settings-page">
    <h2 class="page-title">设置</h2>
    <div class="settings-card">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </div>
    <p class="version">v1.0.0</p>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import BottomNav from '../components/BottomNav.vue'

const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.doLogout()
  router.push('/login')
}
</script>

<style scoped>
.settings-page {
  padding: 20px 16px;
  padding-bottom: 80px;
}

.page-title {
  font-size: 20px;
  margin-bottom: 20px;
}

.settings-card {
  background: var(--card-bg);
  border-radius: 10px;
  padding: 20px;
}

.logout-btn {
  width: 100%;
  padding: 14px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  min-height: 44px;
}

.version {
  text-align: center;
  color: var(--text-secondary);
  font-size: 12px;
  margin-top: 30px;
}
</style>
