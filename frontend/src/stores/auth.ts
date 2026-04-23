import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoggedIn = computed(() => !!token.value)

  async function doLogin(username: string, password: string) {
    const response = await apiLogin(username, password)
    token.value = response.access_token
    localStorage.setItem('token', response.access_token)
  }

  function doLogout() {
    token.value = null
    localStorage.removeItem('token')
  }

  return { token, isLoggedIn, doLogin, doLogout }
})
