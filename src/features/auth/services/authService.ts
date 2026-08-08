import { apiClient } from '../../../lib/api/client'
import type { LoginCredentials, LoginResponse } from '../types/auth'

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const form = new URLSearchParams()
  form.set('grant_type', 'password')
  form.set('username', credentials.username.trim())
  form.set('password', credentials.password)
  form.set('scope', '')

  const { data } = await apiClient.post<LoginResponse>('/auth/login', form, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  return data
}
