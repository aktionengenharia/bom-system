import api from './client'
import {
  FamiliaMaterial,
  SubfamiliaMaterial,
  Material,
  MaterialDetail,
  HistoricoPreco,
} from '../types'

export const familias = {
  list: async () => (await api.get<FamiliaMaterial[]>('/familias')).data,
  create: async (data: { nome: string; descricao?: string }) =>
    (await api.post<FamiliaMaterial>('/familias', data)).data,
  delete: async (id: number) => api.delete(`/familias/${id}`),
}

export const subfamilias = {
  list: async (familia_id?: number) =>
    (await api.get<SubfamiliaMaterial[]>('/subfamilias', { params: { familia_id } })).data,
  create: async (data: { familia_id: number; nome: string; descricao?: string }) =>
    (await api.post<SubfamiliaMaterial>('/subfamilias', data)).data,
  delete: async (id: number) => api.delete(`/subfamilias/${id}`),
}

export const materials = {
  list: async (params?: { search?: string; familia_id?: number; status?: boolean }) =>
    (await api.get<Material[]>('/materiais', { params })).data,

  get: async (id: number) => (await api.get<MaterialDetail>(`/materiais/${id}`)).data,

  create: async (data: Partial<Material>) =>
    (await api.post<Material>('/materiais', data)).data,

  update: async (id: number, data: Partial<Material>) =>
    (await api.put<Material>(`/materiais/${id}`, data)).data,

  delete: async (id: number) => api.delete(`/materiais/${id}`),

  exportExcel: () => {
    const token = localStorage.getItem('token')
    const url = '/api/materiais/export/excel'
    const a = document.createElement('a')
    a.href = url
    a.setAttribute(
      'download',
      `materiais_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
    // Use fetch to add auth header
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob)
        a.href = blobUrl
        a.click()
        URL.revokeObjectURL(blobUrl)
      })
  },

  importExcel: async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/materiais/import/excel', form)
    return data
  },
}

export const priceHistory = {
  list: async (materialId: number) =>
    (await api.get<HistoricoPreco[]>(`/materiais/${materialId}/historico-precos`)).data,

  add: async (
    materialId: number,
    data: { preco: number; fonte?: string; observacao?: string }
  ) =>
    (await api.post<HistoricoPreco>(`/materiais/${materialId}/historico-precos`, data)).data,
}
