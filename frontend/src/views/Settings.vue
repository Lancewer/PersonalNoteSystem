<template>
  <AppLayout>
    <div class="settings-container">
      <h2 class="page-title">设置</h2>
      <div class="settings-card">
        <div class="setting-item">
          <label class="setting-label">时区</label>
          <select v-model="selectedTimezone" @change="handleTimezoneChange" class="timezone-select">
            <option v-for="tz in timezones" :key="tz.value" :value="tz.value">
              {{ tz.label }}
            </option>
          </select>
        </div>
      </div>
      <p class="version">v1.0.0</p>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'
import AppLayout from '../components/AppLayout.vue'

const settingsStore = useSettingsStore()

const selectedTimezone = ref(settingsStore.timezone)

const timezones = [
  { label: '北京时间 (UTC+8)', value: 'Asia/Shanghai' },
  { label: '东京时间 (UTC+9)', value: 'Asia/Tokyo' },
  { label: '首尔时间 (UTC+9)', value: 'Asia/Seoul' },
  { label: '台北时间 (UTC+8)', value: 'Asia/Taipei' },
  { label: '新加坡时间 (UTC+8)', value: 'Asia/Singapore' },
  { label: '纽约时间 (UTC-5)', value: 'America/New_York' },
  { label: '洛杉矶时间 (UTC-8)', value: 'America/Los_Angeles' },
  { label: '伦敦时间 (UTC+0)', value: 'Europe/London' },
  { label: '巴黎时间 (UTC+1)', value: 'Europe/Paris' },
]

function handleTimezoneChange() {
  settingsStore.setTimezone(selectedTimezone.value)
}
</script>

<style scoped>
.settings-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-color);
}

.settings-card {
  background: var(--card-bg);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.timezone-select {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 15px;
  background: var(--card-bg);
  color: var(--text-color);
  outline: none;
  min-height: 44px;
}

.timezone-select:focus {
  border-color: var(--primary-color);
}

.version {
  text-align: center;
  color: var(--text-secondary);
  font-size: 12px;
  margin-top: 30px;
}
</style>
