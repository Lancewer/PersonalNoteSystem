import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoggedIn = computed(() => token.value !== null)

  function doLogin(accessToken: string) {
    token.value = accessToken
    localStorage.setItem('token', accessToken)
  }

  function doLogout() {
    token.value = null
    localStorage.removeItem('token')
  }

  return { token, isLoggedIn, doLogin, doLogout }
})
