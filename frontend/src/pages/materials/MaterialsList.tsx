import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Download, Upload, Pencil, Trash2, Eye, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { materials, familias } from '../../api/materials'
import { Material, FamiliaMaterial } from '../../types'
import Modal from '../../components/Modal'
import MaterialForm from './MaterialForm'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function MaterialsList() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { canEdit, isAdmin } = useAuth()

  const [search, setSearch] = useState('')
  const [filterFamilia, setFilterFamilia] = useState<number | undefined>()
  const [filterStatus, setFilterStatus] = useState<boolean | undefined>(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['materiais', search, filterFamilia, filterStatus],
    queryFn: () =>
      materials.list({
        search: search || undefined,
        familia_id: filterFamilia,
        status: filterStatus,
      }),
    staleTime: 30_000,
  })

  const { data: familiasList = [] } = useQuery({
    queryKey: ['familias'],
    queryFn: familias.list,
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => materials.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materiais'] })
      toast.success('Material excluído')
    },
    onError: () => toast.error('Erro ao excluir'),
  })

  function handleEdit(m: Material) {
    setEditing(m)
    setModalOpen(true)
  }

  function handleNew() {
    setEditing(null)
    setModalOpen(true)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await materials.importExcel(file)
      toast.success(`${result.created} materiais importados`)
      if (result.errors?.length) {
        console.warn('Erros na importação:', result.errors)
        toast.error(`${result.errors.length} linhas ignoradas (ver console)`)
      }
      qc.invalidateQueries({ queryKey: ['materiais'] })
    } catch {
      toast.error('Erro ao importar Excel')
    }
    e.target.value = ''
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lista de Materiais</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} {items.length === 1 ? 'material' : 'materiais'} encontrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => materials.exportExcel()}
            className="btn-secondary"
          >
            <Download size={15} />
            Exportar
          </button>
          {canEdit && (
            <>
              <label className="btn-secondary cursor-pointer">
                <Upload size={15} />
                Importar Excel
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
              <button onClick={handleNew} className="btn-primary">
                <Plus size={15} />
                Novo Material
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por descrição, código, fabricante..."
            className="input pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={filterFamilia ?? ''}
          onChange={(e) =>
            setFilterFamilia(e.target.value ? Number(e.target.value) : undefined)
          }
        >
          <option value="">Todas as famílias</option>
          {familiasList.map((f: FamiliaMaterial) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={filterStatus === undefined ? '' : String(filterStatus)}
          onChange={(e) =>
            setFilterStatus(
              e.target.value === '' ? undefined : e.target.value === 'true'
            )
          }
        >
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
          <option value="">Todos</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-700 border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum material encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="table-th">Código</th>
                  <th className="table-th">Família</th>
                  <th className="table-th">Descrição</th>
                  <th className="table-th">Fabricante</th>
                  <th className="table-th">Unidade</th>
                  <th className="table-th text-right">Preço Médio</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td font-mono text-xs text-gray-500">
                      {m.codigo_interno || '–'}
                    </td>
                    <td className="table-td">
                      <span className="badge-blue">{m.familia?.nome}</span>
                    </td>
                    <td className="table-td max-w-xs">
                      <span className="line-clamp-2">{m.descricao}</span>
                    </td>
                    <td className="table-td text-gray-500">{m.fabricante || '–'}</td>
                    <td className="table-td">{m.unidade}</td>
                    <td className="table-td text-right font-medium text-green-700">
                      {m.preco_medio > 0
                        ? m.preco_medio.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : <span className="text-amber-500 text-xs">Sem preço</span>}
                    </td>
                    <td className="table-td">
                      <span className={m.status ? 'badge-active' : 'badge-inactive'}>
                        {m.status ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-1">
                        <button
                          title="Ver detalhes"
                          onClick={() => navigate(`/materiais/${m.id}`)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-brand-700"
                        >
                          <Eye size={14} />
                        </button>
                        {canEdit && (
                          <button
                            title="Editar"
                            onClick={() => handleEdit(m)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-brand-700"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            title="Excluir"
                            onClick={() => {
                              if (confirm(`Excluir "${m.descricao}"?`))
                                deleteMut.mutate(m.id)
                            }}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Material' : 'Novo Material'}
        size="lg"
      >
        <MaterialForm
          initial={editing}
          onSuccess={() => {
            setModalOpen(false)
            qc.invalidateQueries({ queryKey: ['materiais'] })
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  )
}

function Package({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  )
}
