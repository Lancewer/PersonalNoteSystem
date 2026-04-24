import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const timezone = ref<string>(localStorage.getItem('timezone') || 'Asia/Shanghai')

  function setTimezone(tz: string) {
    timezone.value = tz
    localStorage.setItem('timezone', tz)
  }

  return { timezone, setTimezone }
})
