import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { familias, subfamilias, materials } from '../../api/materials'
import { Material } from '../../types'

interface Props {
  initial: Material | null
  onSuccess: () => void
  onCancel: () => void
}

interface FormData {
  codigo_interno?: string
  familia_id: number
  subfamilia_id?: number
  descricao: string
  fabricante?: string
  modelo?: string
  unidade: string
  preco_medio: number
  status: boolean
  fonte_preco?: string
  lead_time?: number
  observacoes?: string
}

const UNIDADES = ['un', 'm', 'm²', 'm³', 'kg', 'L', 'kVA', 'kW', 'kWp', 'MVA', 'MWp', 'rolo', 'cx']

export default function MaterialForm({ initial, onSuccess, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      unidade: 'un',
      status: true,
      preco_medio: 0,
      ...initial,
    },
  })

  const familiaId = watch('familia_id')

  const { data: familiasList = [] } = useQuery({
    queryKey: ['familias'],
    queryFn: familias.list,
  })
  const { data: subfamiliasList = [] } = useQuery({
    queryKey: ['subfamilias', familiaId],
    queryFn: () => subfamilias.list(familiaId ? Number(familiaId) : undefined),
    enabled: !!familiaId,
  })

  useEffect(() => {
    reset({
      unidade: 'un',
      status: true,
      preco_medio: 0,
      ...initial,
    })
  }, [initial, reset])

  async function onSubmit(data: FormData) {
    try {
      const payload = {
        ...data,
        familia_id: Number(data.familia_id),
        subfamilia_id: data.subfamilia_id ? Number(data.subfamilia_id) : undefined,
        preco_medio: Number(data.preco_medio),
        lead_time: data.lead_time ? Number(data.lead_time) : undefined,
      }
      if (initial) {
        await materials.update(initial.id, payload)
        toast.success('Material atualizado')
      } else {
        await materials.create(payload)
        toast.success('Material criado')
      }
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erro ao salvar')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Código Interno</label>
          <input className="input" placeholder="Ex: MOD-550-MONO" {...register('codigo_interno')} />
        </div>
        <div>
          <label className="label">
            Família <span className="text-red-500">*</span>
          </label>
          <select
            className="input"
            {...register('familia_id', { required: 'Família obrigatória' })}
          >
            <option value="">Selecione...</option>
            {familiasList.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
          {errors.familia_id && (
            <p className="text-red-500 text-xs mt-1">{errors.familia_id.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Subfamília</label>
          <select className="input" {...register('subfamilia_id')}>
            <option value="">Nenhuma</option>
            {subfamiliasList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">
            Unidade <span className="text-red-500">*</span>
          </label>
          <select className="input" {...register('unidade', { required: true })}>
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">
          Descrição Técnica <span className="text-red-500">*</span>
        </label>
        <input
          className="input"
          placeholder="Descrição completa do material"
          {...register('descricao', { required: 'Descrição obrigatória' })}
        />
        {errors.descricao && (
          <p className="text-red-500 text-xs mt-1">{errors.descricao.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Fabricante</label>
          <input className="input" placeholder="Ex: JA Solar" {...register('fabricante')} />
        </div>
        <div>
          <label className="label">Modelo</label>
          <input className="input" placeholder="Ex: JAM72S30-550/MR" {...register('modelo')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Preço Médio (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input"
            {...register('preco_medio', { min: 0 })}
          />
        </div>
        <div>
          <label className="label">Fonte de Preço</label>
          <input
            className="input"
            placeholder="Ex: Cotação fornecedor"
            {...register('fonte_preco')}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Lead Time (dias)</label>
          <input
            type="number"
            min="0"
            className="input"
            placeholder="Dias"
            {...register('lead_time')}
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-brand-700"
              {...register('status')}
            />
            <span className="text-sm text-gray-700">Material Ativo</span>
          </label>
        </div>
      </div>

      <div>
        <label className="label">Observações</label>
        <textarea
          rows={2}
          className="input resize-none"
          placeholder="Informações adicionais..."
          {...register('observacoes')}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Salvando...' : initial ? 'Salvar Alterações' : 'Criar Material'}
        </button>
      </div>
    </form>
  )
}
