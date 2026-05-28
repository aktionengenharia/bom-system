import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Pencil, Trash2, FolderOpen, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { projetos } from '../../api/projects'
import { Projeto } from '../../types'
import Modal from '../../components/Modal'
import ProjectForm from './ProjectForm'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  Ativo: 'badge-active',
  Concluído: 'badge-blue',
  Suspenso: 'badge-warning',
  Cancelado: 'badge-inactive',
}

const TIPO_COLORS: Record<string, string> = {
  UFV: 'bg-yellow-100 text-yellow-800',
  BESS: 'bg-purple-100 text-purple-800',
  'Híbrido': 'bg-orange-100 text-orange-800',
  'Geração': 'bg-blue-100 text-blue-800',
  Industrial: 'bg-gray-100 text-gray-700',
}

export default function ProjectsList() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { canEdit, isAdmin } = useAuth()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Projeto | null>(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['projetos', search, filterStatus, filterTipo],
    queryFn: () =>
      projetos.list({
        search: search || undefined,
        status: filterStatus || undefined,
        tipo: filterTipo || undefined,
      }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => projetos.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projetos'] })
      toast.success('Projeto excluído')
    },
    onError: () => toast.error('Erro ao excluir'),
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projetos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} projeto{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="btn-primary"
          >
            <Plus size={15} />
            Novo Projeto
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-8"
            placeholder="Buscar por nome ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-auto"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          {['Ativo', 'Concluído', 'Suspenso', 'Cancelado'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          {['UFV', 'BESS', 'Híbrido', 'Geração', 'Industrial'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="flex justify-center p-10">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-700 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum projeto encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((p: Projeto) => (
            <div key={p.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      TIPO_COLORS[p.tipo] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {p.tipo}
                  </span>
                </div>
                <span className={`text-xs ${STATUS_COLORS[p.status] ?? 'badge-inactive'}`}>
                  {p.status}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{p.nome}</h3>

              {p.codigo_interno && (
                <p className="text-xs font-mono text-gray-400 mb-2">{p.codigo_interno}</p>
              )}

              <div className="text-sm text-gray-500 space-y-1 mb-4">
                {p.cliente && <p>🏢 {p.cliente.nome}</p>}
                {p.potencia_kwp && (
                  <p>⚡ {p.potencia_kwp.toLocaleString('pt-BR')} kWp</p>
                )}
                {p.localizacao && <p>📍 {p.localizacao}</p>}
                {p.responsavel && <p>👤 {p.responsavel.nome}</p>}
              </div>

              {p.created_at && (
                <p className="text-xs text-gray-300 mb-3">
                  Criado em {format(new Date(p.created_at), 'dd/MM/yyyy')}
                </p>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => navigate(`/projetos/${p.id}/bom`)}
                  className="btn-primary flex-1 justify-center text-xs py-1.5"
                >
                  <ExternalLink size={13} />
                  Abrir BOM
                </button>
                {canEdit && (
                  <button
                    onClick={() => { setEditing(p); setModalOpen(true) }}
                    className="btn-secondary px-3"
                  >
                    <Pencil size={13} />
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm(`Excluir projeto "${p.nome}"?`))
                        deleteMut.mutate(p.id)
                    }}
                    className="btn-secondary px-3 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar Projeto' : 'Novo Projeto'}
        size="lg"
      >
        <ProjectForm
          initial={editing}
          onSuccess={() => {
            setModalOpen(false)
            qc.invalidateQueries({ queryKey: ['projetos'] })
            qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
