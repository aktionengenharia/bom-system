import api from './client'
import { User } from '../types'

export const users = {
  list: async () => (await api.get<User[]>('/users/')).data,

  create: async (data: {
    nome: string
    email: string
    login: string
    password: string
    cargo?: string
    area?: string
    perfil: string
  }) => (await api.post<User>('/users/', data)).data,

  update: async (id: number, data: Partial<User> & { password?: string }) =>
    (await api.put<User>(`/users/${id}`, data)).data,

  delete: async (id: number) => api.delete(`/users/${id}`),
}

export const dashboard = {
  stats: async () => {
    const { data } = await api.get('/dashboard/stats')
    return data
  },
}
