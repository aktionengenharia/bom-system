import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { clientes } from '../../api/projects'
import { Cliente } from '../../types'
import Modal from '../../components/Modal'
import { useAuth } from '../../contexts/AuthContext'

export default function ClientesList() {
  const qc = useQueryClient()
  const { canEdit } = useAuth()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [form, setForm] = useState({ nome: '', documento: '', email: '', telefone: '' })

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: clientes.list,
  })

  const saveMut = useMutation({
    mutationFn: () =>
      editing
        ? clientes.update(editing.id, { ...form, status: true })
        : clientes.create({ ...form, status: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientes'] })
      setModal(false)
      toast.success(editing ? 'Cliente atualizado' : 'Cliente criado')
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Erro'),
  })

  function openNew() {
    setEditing(null)
    setForm({ nome: '', documento: '', email: '', telefone: '' })
    setModal(true)
  }

  function openEdit(c: Cliente) {
    setEditing(c)
    setForm({ nome: c.nome, documento: c.documento || '', email: c.email || '', telefone: c.telefone || '' })
    setModal(true)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} clientes cadastrados</p>
        </div>
        {canEdit && (
          <button onClick={openNew} className="btn-primary">
            <Plus size={15} />
            Novo Cliente
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-700 border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Building2 size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum cliente cadastrado.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="table-th">Nome</th>
                <th className="table-th">Documento</th>
                <th className="table-th">E-mail</th>
                <th className="table-th">Telefone</th>
                <th className="table-th">Status</th>
                {canEdit && <th className="table-th">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((c: Cliente) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="table-td font-medium">{c.nome}</td>
                  <td className="table-td text-gray-500">{c.documento || '–'}</td>
                  <td className="table-td text-gray-500">{c.email || '–'}</td>
                  <td className="table-td text-gray-500">{c.telefone || '–'}</td>
                  <td className="table-td">
                    <span className={c.status ? 'badge-active' : 'badge-inactive'}>
                      {c.status ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="table-td">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-brand-700"
                      >
                        <Pencil size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Editar Cliente' : 'Novo Cliente'}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input
              className="input"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="label">CNPJ / CPF</label>
            <input
              className="input"
              value={form.documento}
              onChange={(e) => setForm({ ...form, documento: e.target.value })}
              placeholder="00.000.000/0001-00"
            />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input
              className="input"
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={() => saveMut.mutate()}
              disabled={!form.nome || saveMut.isPending}
              className="btn-primary"
            >
              {saveMut.isPending ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
