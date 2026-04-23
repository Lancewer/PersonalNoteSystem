import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)

  const isLoggedIn = ref(false)

  return { token, isLoggedIn }
})
