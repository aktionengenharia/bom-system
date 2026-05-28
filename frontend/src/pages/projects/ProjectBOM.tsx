import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Plus,
  Download,
  Trash2,
  Pencil,
  Search,
  GitBranch,
  Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { bom, projetos } from '../../api/projects'
import { materials } from '../../api/materials'
import { ProjectBOM as PBOM, Material, ProjectBOMItem } from '../../types'
import Modal from '../../components/Modal'
import { useAuth } from '../../contexts/AuthContext'
import { format } from 'date-fns'

export default function ProjectBOMPage() {
  const { id } = useParams<{ id: string }>()
  const projetoId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { canEdit } = useAuth()

  const [selectedBomId, setSelectedBomId] = useState<number | null>(null)
  const [addItemModal, setAddItemModal] = useState(false)
  const [newRevModal, setNewRevModal] = useState(false)
  const [searchMaterial, setSearchMaterial] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [obs, setObs] = useState('')
  const [editingItem, setEditingItem] = useState<ProjectBOMItem | null>(null)

  const { data: projeto } = useQuery({
    queryKey: ['projeto', projetoId],
    queryFn: () => projetos.get(projetoId),
  })

  const { data: boms = [], isLoading: bomsLoading } = useQuery({
    queryKey: ['boms', projetoId],
    queryFn: () => bom.list(projetoId),
  })

  const currentBomId = selectedBomId ?? (boms.length > 0 ? boms[0].id : null)
  const currentBom = boms.find((b: PBOM) => b.id === currentBomId)

  const { data: materiaisSearch = [] } = useQuery({
    queryKey: ['materiais', searchMaterial],
    queryFn: () => materials.list({ search: searchMaterial || undefined, status: true }),
    enabled: addItemModal,
  })

  const createBomMut = useMutation({
    mutationFn: (data: { descricao?: string }) =>
      bom.create(projetoId, { ...data, status: 'Em elaboração' }),
    onSuccess: (newBom) => {
      qc.invalidateQueries({ queryKey: ['boms', projetoId] })
      setSelectedBomId(newBom.id)
      setNewRevModal(false)
      toast.success(`Revisão ${newBom.revisao} criada`)
    },
    onError: () => toast.error('Erro ao criar revisão'),
  })

  const addItemMut = useMutation({
    mutationFn: (item: { material_id: number; quantidade: number; preco_unitario: number; observacao?: string }) =>
      bom.addItem(projetoId, currentBomId!, item),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boms', projetoId] })
      setSelectedMaterial(null)
      setQty('')
      setPrice('')
      setObs('')
      toast.success('Item adicionado')
    },
    onError: () => toast.error('Erro ao adicionar'),
  })

  const updateItemMut = useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: number
      data: { quantidade?: number; preco_unitario?: number; observacao?: string }
    }) => bom.updateItem(projetoId, currentBomId!, itemId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boms', projetoId] })
      setEditingItem(null)
      toast.success('Item atualizado')
    },
    onError: () => toast.error('Erro ao atualizar'),
  })

  const deleteItemMut = useMutation({
    mutationFn: (itemId: number) => bom.deleteItem(projetoId, currentBomId!, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boms', projetoId] })
      toast.success('Item removido')
    },
  })

  const total = currentBom?.items.reduce(
    (sum, i) => sum + i.quantidade * i.preco_unitario,
    0
  ) ?? 0

  const [newRevDesc, setNewRevDesc] = useState('')

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/projetos')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {projeto?.nome ?? `Projeto #${projetoId}`}
          </h1>
          <p className="text-sm text-gray-500">
            {projeto?.codigo_interno} · {projeto?.tipo} · {projeto?.status}
          </p>
        </div>
      </div>

      {/* BOM revision selector */}
      <div className="card p-4 mb-4 flex items-center gap-3 flex-wrap">
        <GitBranch size={16} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-700">Revisão:</span>
        <div className="flex gap-2 flex-wrap">
          {boms.map((b: PBOM) => (
            <button
              key={b.id}
              onClick={() => setSelectedBomId(b.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                b.id === currentBomId
                  ? 'bg-brand-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Rev {b.revisao} {b.descricao ? `– ${b.descricao}` : ''}
              <span
                className={`ml-1.5 ${
                  b.id === currentBomId ? 'text-white/70' : 'text-gray-400'
                }`}
              >
                ({b.status})
              </span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          {currentBom && (
            <button
              onClick={() => bom.exportExcel(projetoId, currentBomId!)}
              className="btn-secondary"
            >
              <Download size={14} />
              Exportar Excel
            </button>
          )}
          {canEdit && (
            <>
              <button
                onClick={() => setNewRevModal(true)}
                className="btn-secondary"
              >
                <GitBranch size={14} />
                Nova Revisão
              </button>
              {currentBom && (
                <button
                  onClick={() => setAddItemModal(true)}
                  className="btn-primary"
                >
                  <Plus size={14} />
                  Adicionar Item
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* BOM Table */}
      {bomsLoading ? (
        <div className="flex justify-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-700 border-t-transparent" />
        </div>
      ) : !currentBom ? (
        <div className="card p-10 text-center text-gray-400">
          <p className="mb-4">Nenhuma BOM criada para este projeto.</p>
          {canEdit && (
            <button onClick={() => setNewRevModal(true)} className="btn-primary mx-auto">
              <Plus size={14} />
              Criar Primeira Revisão
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Rev {currentBom.revisao}</span>
              {currentBom.descricao && ` – ${currentBom.descricao}`}
              <span className="ml-2 text-gray-400">·</span>
              <span className="ml-2">{currentBom.status}</span>
            </div>
            <div className="text-sm text-gray-500">
              {currentBom.items.length} {currentBom.items.length === 1 ? 'item' : 'itens'}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-th w-10">#</th>
                  <th className="table-th">Código</th>
                  <th className="table-th">Família</th>
                  <th className="table-th">Descrição</th>
                  <th className="table-th">Fabricante</th>
                  <th className="table-th text-center">Un.</th>
                  <th className="table-th text-right">Qtd.</th>
                  <th className="table-th text-right">Preço Unit.</th>
                  <th className="table-th text-right">Total</th>
                  {canEdit && <th className="table-th">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentBom.items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-gray-400 text-sm">
                      Nenhum item na BOM. Clique em "Adicionar Item".
                    </td>
                  </tr>
                ) : (
                  currentBom.items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="table-td text-gray-400">{idx + 1}</td>
                      <td className="table-td font-mono text-xs text-gray-500">
                        {item.material?.codigo_interno || '–'}
                      </td>
                      <td className="table-td">
                        <span className="badge-blue text-xs">
                          {item.material?.familia?.nome ?? '–'}
                        </span>
                      </td>
                      <td className="table-td max-w-xs">
                        <span className="line-clamp-2">
                          {item.material?.descricao ?? `Material #${item.material_id}`}
                        </span>
                      </td>
                      <td className="table-td text-gray-500 text-xs">
                        {(item.material as any)?.fabricante || '–'}
                      </td>
                      <td className="table-td text-center">{item.material?.unidade ?? '–'}</td>
                      <td className="table-td text-right font-medium">
                        {editingItem?.id === item.id ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input w-24 text-right"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                          />
                        ) : (
                          item.quantidade.toLocaleString('pt-BR')
                        )}
                      </td>
                      <td className="table-td text-right">
                        {editingItem?.id === item.id ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input w-28 text-right"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                          />
                        ) : (
                          item.preco_unitario.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        )}
                      </td>
                      <td className="table-td text-right font-semibold text-green-700">
                        {(item.quantidade * item.preco_unitario).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                      {canEdit && (
                        <td className="table-td">
                          <div className="flex items-center gap-1">
                            {editingItem?.id === item.id ? (
                              <button
                                onClick={() =>
                                  updateItemMut.mutate({
                                    itemId: item.id,
                                    data: {
                                      quantidade: Number(qty),
                                      preco_unitario: Number(price),
                                    },
                                  })
                                }
                                className="p-1.5 hover:bg-green-50 rounded text-green-600"
                              >
                                <Check size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingItem(item)
                                  setQty(String(item.quantidade))
                                  setPrice(String(item.preco_unitario))
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                              >
                                <Pencil size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm('Remover item da BOM?'))
                                  deleteItemMut.mutate(item.id)
                              }}
                              className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
              {currentBom.items.length > 0 && (
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td
                      colSpan={canEdit ? 8 : 8}
                      className="table-td text-right font-semibold"
                    >
                      TOTAL
                    </td>
                    <td className="table-td text-right font-bold text-green-700 text-base">
                      {total.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    {canEdit && <td />}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Add item modal */}
      <Modal
        open={addItemModal}
        onClose={() => {
          setAddItemModal(false)
          setSelectedMaterial(null)
          setSearchMaterial('')
        }}
        title="Adicionar Item à BOM"
        size="lg"
      >
        <div className="space-y-4">
          {!selectedMaterial ? (
            <>
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  className="input pl-8"
                  placeholder="Buscar material por descrição, código..."
                  value={searchMaterial}
                  onChange={(e) => setSearchMaterial(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {materiaisSearch.length === 0 ? (
                  <p className="p-4 text-sm text-gray-400 text-center">
                    {searchMaterial ? 'Nenhum material encontrado.' : 'Digite para buscar...'}
                  </p>
                ) : (
                  materiaisSearch.map((m: Material) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMaterial(m)
                        setPrice(String(m.preco_medio))
                      }}
                      className="w-full text-left p-3 hover:bg-brand-50 transition-colors"
                    >
                      <p className="text-sm font-medium">{m.descricao}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {m.familia?.nome} · {m.unidade} · {m.codigo_interno || 'Sem código'} ·{' '}
                        {m.preco_medio.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-brand-50 rounded-lg border border-brand-100">
                <p className="text-sm font-medium text-brand-900">{selectedMaterial.descricao}</p>
                <p className="text-xs text-brand-600 mt-0.5">
                  {selectedMaterial.familia?.nome} · {selectedMaterial.unidade}
                </p>
                <button
                  onClick={() => { setSelectedMaterial(null); setQty(''); setPrice('') }}
                  className="text-xs text-brand-600 underline mt-1"
                >
                  Trocar material
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Quantidade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">
                    Preço Unitário (R$) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label">Observação</label>
                <input
                  className="input"
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                />
              </div>
              {qty && price && (
                <p className="text-sm text-gray-600">
                  Total:{' '}
                  <span className="font-semibold text-green-700">
                    {(Number(qty) * Number(price)).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </span>
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button onClick={() => setAddItemModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (!qty || !price) return toast.error('Informe quantidade e preço')
                    addItemMut.mutate({
                      material_id: selectedMaterial!.id,
                      quantidade: Number(qty),
                      preco_unitario: Number(price),
                      observacao: obs || undefined,
                    })
                    setAddItemModal(false)
                  }}
                  disabled={addItemMut.isPending}
                  className="btn-primary"
                >
                  Adicionar
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* New revision modal */}
      <Modal
        open={newRevModal}
        onClose={() => setNewRevModal(false)}
        title="Nova Revisão da BOM"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Cria uma nova revisão em branco para este projeto.
          </p>
          <div>
            <label className="label">Descrição (opcional)</label>
            <input
              className="input"
              placeholder="Ex: Revisão após aprovação cliente"
              value={newRevDesc}
              onChange={(e) => setNewRevDesc(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setNewRevModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={() => {
                createBomMut.mutate({ descricao: newRevDesc || undefined })
                setNewRevDesc('')
              }}
              disabled={createBomMut.isPending}
              className="btn-primary"
            >
              Criar Revisão
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
