import request from './request'
import type { TokenResponse } from '../types'

export const login = (username: string, password: string): Promise<TokenResponse> => {
  return request.post('/auth/login', { username, password }).then(res => res.data)
}

export const register = (username: string, password: string): Promise<TokenResponse> => {
  return request.post('/auth/register', { username, password }).then(res => res.data)
}
