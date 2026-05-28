import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  TrendingUp,
  Plus,
  Calendar,
  Tag,
  Package,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { materials, priceHistory } from '../../api/materials'
import { MaterialDetail as MaterialDetailType } from '../../types'
import Modal from '../../components/Modal'
import { useAuth } from '../../contexts/AuthContext'

export default function MaterialDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { canUpdatePrices } = useAuth()

  const [priceModal, setPriceModal] = useState(false)
  const [newPrice, setNewPrice] = useState('')
  const [newSource, setNewSource] = useState('')
  const [newObs, setNewObs] = useState('')

  const { data: material, isLoading } = useQuery<MaterialDetailType>({
    queryKey: ['material', id],
    queryFn: () => materials.get(Number(id)),
  })

  const addPriceMut = useMutation({
    mutationFn: (data: { preco: number; fonte?: string; observacao?: string }) =>
      priceHistory.add(Number(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['material', id] })
      qc.invalidateQueries({ queryKey: ['materiais'] })
      toast.success('Preço registrado')
      setPriceModal(false)
      setNewPrice('')
      setNewSource('')
      setNewObs('')
    },
    onError: () => toast.error('Erro ao registrar preço'),
  })

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-700 border-t-transparent" />
      </div>
    )
  }

  if (!material) return <div className="p-8">Material não encontrado.</div>

  const chartData = [...material.historico_precos]
    .reverse()
    .map((h) => ({
      data: h.created_at ? format(new Date(h.created_at), 'dd/MM/yy') : '',
      preco: h.preco,
    }))

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/materiais')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{material.descricao}</h1>
          <p className="text-sm text-gray-500">
            {material.codigo_interno && (
              <span className="font-mono mr-2">{material.codigo_interno}</span>
            )}
            {material.familia?.nome}
            {material.subfamilia && ` › ${material.subfamilia.nome}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="card p-5 lg:col-span-1">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Tag size={16} />
            Informações
          </h2>
          <dl className="space-y-3 text-sm">
            {[
              ['Código', material.codigo_interno || '–'],
              ['Família', material.familia?.nome || '–'],
              ['Subfamília', material.subfamilia?.nome || '–'],
              ['Fabricante', material.fabricante || '–'],
              ['Modelo', material.modelo || '–'],
              ['Unidade', material.unidade],
              ['Fonte Preço', material.fonte_preco || '–'],
              ['Lead Time', material.lead_time ? `${material.lead_time} dias` : '–'],
              ['Status', material.status ? '✓ Ativo' : '✗ Inativo'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-gray-500">{k}</dt>
                <dd className="font-medium text-right">{v}</dd>
              </div>
            ))}
          </dl>

          {material.observacoes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              {material.observacoes}
            </div>
          )}

          <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Preço Atual</p>
            <p className="text-xl font-bold text-green-700">
              {material.preco_medio > 0
                ? material.preco_medio.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })
                : 'Sem preço'}
            </p>
          </div>

          {canUpdatePrices && (
            <button
              onClick={() => setPriceModal(true)}
              className="btn-primary w-full justify-center mt-3"
            >
              <Plus size={14} />
              Atualizar Preço
            </button>
          )}
        </div>

        {/* Price history */}
        <div className="card lg:col-span-2">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp size={16} />
              Histórico de Preços
            </h2>
            <span className="text-xs text-gray-400">
              {material.historico_precos.length} registros
            </span>
          </div>

          {chartData.length > 1 && (
            <div className="p-4 border-b">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      v.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                      })
                    }
                    width={80}
                  />
                  <Tooltip
                    formatter={(v: number) =>
                      v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="preco"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="divide-y overflow-y-auto max-h-72">
            {material.historico_precos.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                Nenhum registro de preço ainda.
              </div>
            ) : (
              material.historico_precos.map((h) => (
                <div key={h.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">
                      {h.preco.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {h.fonte || '–'} · {h.usuario?.nome || `Usuário #${h.usuario_id}`}
                    </p>
                    {h.observacao && (
                      <p className="text-xs text-gray-500 italic">{h.observacao}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {h.created_at
                      ? format(new Date(h.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                      : '–'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add price modal */}
      <Modal
        open={priceModal}
        onClose={() => setPriceModal(false)}
        title="Registrar Novo Preço"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="label">
              Novo Preço (R$) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Fonte / Fornecedor</label>
            <input
              className="input"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="Ex: Cotação Abril 2025"
            />
          </div>
          <div>
            <label className="label">Observação</label>
            <input
              className="input"
              value={newObs}
              onChange={(e) => setNewObs(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setPriceModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={() => {
                if (!newPrice) return toast.error('Informe o preço')
                addPriceMut.mutate({
                  preco: Number(newPrice),
                  fonte: newSource || undefined,
                  observacao: newObs || undefined,
                })
              }}
              disabled={addPriceMut.isPending}
              className="btn-primary"
            >
              {addPriceMut.isPending ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
