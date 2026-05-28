import api from './client'
import { User, Token } from '../types'

export async function login(username: string, password: string): Promise<Token> {
  const params = new URLSearchParams()
  params.append('username', username)
  params.append('password', password)
  const { data } = await api.post<Token>('/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  return data
}
