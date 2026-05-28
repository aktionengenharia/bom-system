import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { projetos, clientes } from '../../api/projects'
import { users } from '../../api/users'
import { Projeto, TipoProjeto, StatusProjeto } from '../../types'

interface Props {
  initial: Projeto | null
  onSuccess: () => void
  onCancel: () => void
}

interface FormData {
  nome: string
  codigo_interno?: string
  cliente_id?: number
  tipo: TipoProjeto
  potencia_kwp?: number
  tensao?: string
  localizacao?: string
  responsavel_id?: number
  status: StatusProjeto
  observacoes?: string
}

export default function ProjectForm({ initial, onSuccess, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      status: 'Ativo',
      tipo: 'UFV',
      ...initial,
    },
  })

  useEffect(() => {
    reset({ status: 'Ativo', tipo: 'UFV', ...initial })
  }, [initial, reset])

  const { data: clientesList = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: clientes.list,
  })
  const { data: usersList = [] } = useQuery({
    queryKey: ['users'],
    queryFn: users.list,
    retry: false,
  })

  async function onSubmit(data: FormData) {
    try {
      const payload = {
        ...data,
        cliente_id: data.cliente_id ? Number(data.cliente_id) : undefined,
        responsavel_id: data.responsavel_id ? Number(data.responsavel_id) : undefined,
        potencia_kwp: data.potencia_kwp ? Number(data.potencia_kwp) : undefined,
      }
      if (initial) {
        await projetos.update(initial.id, payload)
        toast.success('Projeto atualizado')
      } else {
        await projetos.create(payload)
        toast.success('Projeto criado')
      }
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao salvar')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">
          Nome do Projeto <span className="text-red-500">*</span>
        </label>
        <input
          className="input"
          placeholder="Ex: UFV Parque Solar Norte"
          {...register('nome', { required: 'Nome obrigatório' })}
        />
        {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Código Interno</label>
          <input className="input" placeholder="Ex: PRJ-2025-001" {...register('codigo_interno')} />
        </div>
        <div>
          <label className="label">
            Tipo <span className="text-red-500">*</span>
          </label>
          <select className="input" {...register('tipo', { required: true })}>
            {['UFV', 'BESS', 'Híbrido', 'Geração', 'Industrial'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Cliente</label>
          <select className="input" {...register('cliente_id')}>
            <option value="">Nenhum</option>
            {clientesList.map((c: any) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Responsável</label>
          <select className="input" {...register('responsavel_id')}>
            <option value="">Nenhum</option>
            {usersList.map((u: any) => (
              <option key={u.id} value={u.id}>{u.nome}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Potência (kWp)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input"
            placeholder="Ex: 5000"
            {...register('potencia_kwp')}
          />
        </div>
        <div>
          <label className="label">Tensão</label>
          <input className="input" placeholder="Ex: 13,8kV" {...register('tensao')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Localização</label>
          <input
            className="input"
            placeholder="Cidade, Estado"
            {...register('localizacao')}
          />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" {...register('status')}>
            {['Ativo', 'Concluído', 'Suspenso', 'Cancelado'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Observações</label>
        <textarea
          rows={2}
          className="input resize-none"
          {...register('observacoes')}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Salvando...' : initial ? 'Salvar Alterações' : 'Criar Projeto'}
        </button>
      </div>
    </form>
  )
}
