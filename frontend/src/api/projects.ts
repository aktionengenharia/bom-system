import api from './client'
import { Cliente, Projeto, ProjectBOM, ProjectBOMItem } from '../types'

export const clientes = {
  list: async () => (await api.get<Cliente[]>('/clientes')).data,
  create: async (data: Partial<Cliente>) =>
    (await api.post<Cliente>('/clientes', data)).data,
  update: async (id: number, data: Partial<Cliente>) =>
    (await api.put<Cliente>(`/clientes/${id}`, data)).data,
}

export const projetos = {
  list: async (params?: { status?: string; tipo?: string; search?: string }) =>
    (await api.get<Projeto[]>('/projetos', { params })).data,

  get: async (id: number) => (await api.get<Projeto>(`/projetos/${id}`)).data,

  create: async (data: Partial<Projeto>) =>
    (await api.post<Projeto>('/projetos', data)).data,

  update: async (id: number, data: Partial<Projeto>) =>
    (await api.put<Projeto>(`/projetos/${id}`, data)).data,

  delete: async (id: number) => api.delete(`/projetos/${id}`),
}

export const bom = {
  list: async (projetoId: number) =>
    (await api.get<ProjectBOM[]>(`/projetos/${projetoId}/bom`)).data,

  get: async (projetoId: number, bomId: number) =>
    (await api.get<ProjectBOM>(`/projetos/${projetoId}/bom/${bomId}`)).data,

  create: async (projetoId: number, data: { descricao?: string; status?: string }) =>
    (await api.post<ProjectBOM>(`/projetos/${projetoId}/bom`, data)).data,

  update: async (
    projetoId: number,
    bomId: number,
    data: { descricao?: string; status?: string }
  ) => (await api.put<ProjectBOM>(`/projetos/${projetoId}/bom/${bomId}`, data)).data,

  addItem: async (
    projetoId: number,
    bomId: number,
    item: { material_id: number; quantidade: number; preco_unitario: number; observacao?: string }
  ) => (await api.post<ProjectBOMItem>(`/projetos/${projetoId}/bom/${bomId}/items`, item)).data,

  updateItem: async (
    projetoId: number,
    bomId: number,
    itemId: number,
    data: { quantidade?: number; preco_unitario?: number; observacao?: string }
  ) =>
    (
      await api.put<ProjectBOMItem>(
        `/projetos/${projetoId}/bom/${bomId}/items/${itemId}`,
        data
      )
    ).data,

  deleteItem: async (projetoId: number, bomId: number, itemId: number) =>
    api.delete(`/projetos/${projetoId}/bom/${bomId}/items/${itemId}`),

  exportExcel: async (projetoId: number, bomId: number) => {
    const res = await api.get(`/projetos/${projetoId}/bom/${bomId}/export`, {
      responseType: 'blob',
    })
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `BOM_projeto${projetoId}_rev${bomId}.xlsx`
    a.click()
    URL.revokeObjectURL(blobUrl)
  },
}
