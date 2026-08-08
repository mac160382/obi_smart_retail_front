export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type?: string
  expires_in: number
}

export interface AuthSession {
  accessToken: string
  tokenType: string
  expiresAt: number
}
