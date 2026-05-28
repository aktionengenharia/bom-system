import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { users } from '../../api/users'
import { User } from '../../types'
import Modal from '../../components/Modal'
import { useAuth } from '../../contexts/AuthContext'

const PERFIL_LABELS: Record<string, string> = {
  administrador: 'Administrador',
  engenharia: 'Engenharia',
  projetista: 'Projetista',
  suprimentos: 'Suprimentos',
  consulta: 'Consulta',
}

const PERFIL_COLORS: Record<string, string> = {
  administrador: 'bg-red-100 text-red-800',
  engenharia: 'bg-blue-100 text-blue-800',
  projetista: 'bg-purple-100 text-purple-800',
  suprimentos: 'bg-orange-100 text-orange-800',
  consulta: 'bg-gray-100 text-gray-700',
}

interface FormData {
  nome: string
  email: string
  login: string
  password: string
  cargo: string
  area: string
  perfil: string
  status: boolean
}

const DEFAULT_FORM: FormData = {
  nome: '',
  email: '',
  login: '',
  password: '',
  cargo: '',
  area: '',
  perfil: 'consulta',
  status: true,
}

export default function UsersList() {
  const qc = useQueryClient()
  const { user: currentUser } = useAuth()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState<FormData>(DEFAULT_FORM)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: users.list,
  })

  const createMut = useMutation({
    mutationFn: () =>
      users.create({
        nome: form.nome,
        email: form.email,
        login: form.login,
        password: form.password,
        cargo: form.cargo || undefined,
        area: form.area || undefined,
        perfil: form.perfil,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setModal(false)
      toast.success('Usuário criado')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Erro'),
  })

  const updateMut = useMutation({
    mutationFn: () =>
      users.update(editing!.id, {
        nome: form.nome,
        email: form.email as any,
        cargo: form.cargo || undefined,
        area: form.area || undefined,
        perfil: form.perfil as any,
        status: form.status,
        ...(form.password ? { password: form.password } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setModal(false)
      toast.success('Usuário atualizado')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Erro'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => users.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuário excluído')
    },
    onError: () => toast.error('Erro ao excluir'),
  })

  function openNew() {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setModal(true)
  }

  function openEdit(u: User) {
    setEditing(u)
    setForm({
      nome: u.nome,
      email: u.email,
      login: u.login,
      password: '',
      cargo: u.cargo || '',
      area: u.area || '',
      perfil: u.perfil,
      status: u.status,
    })
    setModal(true)
  }

  function setF<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((prev) => ({ ...prev, [k]: v }))
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} usuários cadastrados</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus size={15} />
          Novo Usuário
        </button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-700 border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-th">Nome</th>
                <th className="table-th">Login</th>
                <th className="table-th">E-mail</th>
                <th className="table-th">Cargo / Área</th>
                <th className="table-th">Perfil</th>
                <th className="table-th">Status</th>
                <th className="table-th">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((u: User) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                        {u.nome[0]?.toUpperCase()}
                      </div>
                      {u.nome}
                      {u.id === currentUser?.id && (
                        <span className="text-xs text-gray-400">(você)</span>
                      )}
                    </div>
                  </td>
                  <td className="table-td font-mono text-sm text-gray-600">{u.login}</td>
                  <td className="table-td text-gray-500 text-sm">{u.email}</td>
                  <td className="table-td text-gray-500 text-sm">
                    {[u.cargo, u.area].filter(Boolean).join(' · ') || '–'}
                  </td>
                  <td className="table-td">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        PERFIL_COLORS[u.perfil] ?? 'bg-gray-100'
                      }`}
                    >
                      {PERFIL_LABELS[u.perfil] ?? u.perfil}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className={u.status ? 'badge-active' : 'badge-inactive'}>
                      {u.status ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-brand-700"
                      >
                        <Pencil size={13} />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => {
                            if (confirm(`Excluir usuário "${u.nome}"?`))
                              deleteMut.mutate(u.id)
                          }}
                          className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Editar Usuário' : 'Novo Usuário'}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nome *</label>
              <input
                className="input"
                value={form.nome}
                onChange={(e) => setF('nome', e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="label">Login *</label>
              <input
                className={`input ${editing ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                value={form.login}
                onChange={(e) => setF('login', e.target.value)}
                disabled={!!editing}
              />
            </div>
          </div>
          <div>
            <label className="label">E-mail *</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setF('email', e.target.value)}
            />
          </div>
          <div>
            <label className="label">
              {editing ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}
            </label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setF('password', e.target.value)}
              placeholder={editing ? 'Nova senha...' : 'Senha inicial'}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Cargo</label>
              <input
                className="input"
                value={form.cargo}
                onChange={(e) => setF('cargo', e.target.value)}
                placeholder="Ex: Engenheiro Eletricista"
              />
            </div>
            <div>
              <label className="label">Área</label>
              <input
                className="input"
                value={form.area}
                onChange={(e) => setF('area', e.target.value)}
                placeholder="Ex: Engenharia"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Perfil *</label>
              <select
                className="input"
                value={form.perfil}
                onChange={(e) => setF('perfil', e.target.value)}
              >
                {Object.entries(PERFIL_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            {editing && (
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={form.status}
                    onChange={(e) => setF('status', e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">Ativo</span>
                </label>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={() => editing ? updateMut.mutate() : createMut.mutate()}
              disabled={
                !form.nome ||
                !form.email ||
                !form.login ||
                (!editing && !form.password) ||
                createMut.isPending ||
                updateMut.isPending
              }
              className="btn-primary"
            >
              {createMut.isPending || updateMut.isPending
                ? 'Salvando...'
                : editing
                ? 'Salvar'
                : 'Criar Usuário'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
