import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { familias, subfamilias } from '../../api/materials'
import { FamiliaMaterial, SubfamiliaMaterial } from '../../types'
import { useAuth } from '../../contexts/AuthContext'

export default function FamiliasList() {
  const qc = useQueryClient()
  const { isAdmin, user } = useAuth()
  const canManage = ['administrador', 'engenharia'].includes(user?.perfil ?? '')

  const [expanded, setExpanded] = useState<number[]>([])
  const [newFamilia, setNewFamilia] = useState('')
  const [newSubMap, setNewSubMap] = useState<Record<number, string>>({})

  const { data: familiasList = [], isLoading } = useQuery({
    queryKey: ['familias'],
    queryFn: familias.list,
  })
  const { data: subfamiliasList = [] } = useQuery({
    queryKey: ['subfamilias', null],
    queryFn: () => subfamilias.list(),
  })

  const createFamiliaMut = useMutation({
    mutationFn: (nome: string) => familias.create({ nome }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['familias'] })
      setNewFamilia('')
      toast.success('Família criada')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Erro'),
  })

  const deleteFamiliaMut = useMutation({
    mutationFn: (id: number) => familias.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['familias'] })
      toast.success('Família excluída')
    },
    onError: () => toast.error('Erro ao excluir (verifique se há materiais vinculados)'),
  })

  const createSubMut = useMutation({
    mutationFn: ({ familia_id, nome }: { familia_id: number; nome: string }) =>
      subfamilias.create({ familia_id, nome }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subfamilias'] })
      qc.invalidateQueries({ queryKey: ['subfamilias', null] })
      toast.success('Subfamília criada')
    },
    onError: () => toast.error('Erro'),
  })

  const deleteSubMut = useMutation({
    mutationFn: (id: number) => subfamilias.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subfamilias'] })
      qc.invalidateQueries({ queryKey: ['subfamilias', null] })
      toast.success('Subfamília excluída')
    },
    onError: () => toast.error('Erro ao excluir'),
  })

  const toggle = (id: number) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))

  const subFor = (familiaId: number) =>
    subfamiliasList.filter((s: SubfamiliaMaterial) => s.familia_id === familiaId)

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Famílias e Subfamílias</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Categorias de materiais utilizadas na classificação da base.
        </p>
      </div>

      {/* Create family */}
      {canManage && (
        <div className="card p-4 mb-6 flex gap-2">
          <input
            className="input flex-1"
            placeholder="Nome da nova família..."
            value={newFamilia}
            onChange={(e) => setNewFamilia(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newFamilia.trim())
                createFamiliaMut.mutate(newFamilia.trim())
            }}
          />
          <button
            onClick={() => newFamilia.trim() && createFamiliaMut.mutate(newFamilia.trim())}
            disabled={createFamiliaMut.isPending}
            className="btn-primary"
          >
            <Plus size={15} />
            Criar Família
          </button>
        </div>
      )}

      {/* List */}
      <div className="card divide-y overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-700 border-t-transparent" />
          </div>
        ) : familiasList.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Nenhuma família cadastrada.
          </div>
        ) : (
          familiasList.map((f: FamiliaMaterial) => {
            const subs = subFor(f.id)
            const isOpen = expanded.includes(f.id)

            return (
              <div key={f.id}>
                <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                  <button
                    className="flex items-center gap-2 text-sm font-medium text-gray-900"
                    onClick={() => toggle(f.id)}
                  >
                    {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    {f.nome}
                    <span className="text-xs text-gray-400 font-normal">
                      ({subs.length} subfamílias)
                    </span>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        if (confirm(`Excluir família "${f.nome}"?`))
                          deleteFamiliaMut.mutate(f.id)
                      }}
                      className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {isOpen && (
                  <div className="bg-gray-50 border-t px-8 pb-3 pt-2">
                    <div className="space-y-1 mb-2">
                      {subs.length === 0 && (
                        <p className="text-xs text-gray-400 italic">Nenhuma subfamília</p>
                      )}
                      {subs.map((s: SubfamiliaMaterial) => (
                        <div key={s.id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">· {s.nome}</span>
                          {canManage && (
                            <button
                              onClick={() => {
                                if (confirm(`Excluir subfamília "${s.nome}"?`))
                                  deleteSubMut.mutate(s.id)
                              }}
                              className="p-0.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {canManage && (
                      <div className="flex gap-2 mt-2">
                        <input
                          className="input text-xs py-1.5 flex-1"
                          placeholder="Nova subfamília..."
                          value={newSubMap[f.id] ?? ''}
                          onChange={(e) =>
                            setNewSubMap((prev) => ({ ...prev, [f.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newSubMap[f.id]?.trim()) {
                              createSubMut.mutate({
                                familia_id: f.id,
                                nome: newSubMap[f.id].trim(),
                              })
                              setNewSubMap((prev) => ({ ...prev, [f.id]: '' }))
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (newSubMap[f.id]?.trim()) {
                              createSubMut.mutate({
                                familia_id: f.id,
                                nome: newSubMap[f.id].trim(),
                              })
                              setNewSubMap((prev) => ({ ...prev, [f.id]: '' }))
                            }
                          }}
                          className="btn-secondary text-xs py-1.5"
                        >
                          <Plus size={13} />
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
