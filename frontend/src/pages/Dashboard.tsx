import { useQuery } from '@tanstack/react-query'
import {
  Package,
  FolderOpen,
  AlertTriangle,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { dashboard } from '../api/users'
import { DashboardStats } from '../types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '../contexts/AuthContext'

function StatCard({
  title,
  value,
  sub,
  icon,
  color,
}: {
  title: string
  value: number | string
  sub?: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: dashboard.stats,
    refetchInterval: 60_000,
  })

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-700 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Bem-vindo, {user?.nome}. Visão geral do sistema BOM.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total de Projetos"
          value={stats?.total_projetos ?? 0}
          icon={<FolderOpen size={20} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Projetos Ativos"
          value={stats?.projetos_ativos ?? 0}
          icon={<Activity size={20} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Total de Materiais"
          value={stats?.total_materiais ?? 0}
          icon={<Package size={20} className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          title="Materiais Ativos"
          value={stats?.materiais_ativos ?? 0}
          icon={<TrendingUp size={20} className="text-indigo-600" />}
          color="bg-indigo-50"
        />
        <StatCard
          title="Sem Preço"
          value={stats?.materiais_sem_preco ?? 0}
          sub="Materiais sem preço cadastrado"
          icon={<AlertTriangle size={20} className="text-amber-600" />}
          color="bg-amber-50"
        />
      </div>

      {/* Recent price updates */}
      <div className="card">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Últimas Atualizações de Preço</h2>
          <p className="text-xs text-gray-500 mt-0.5">10 atualizações mais recentes</p>
        </div>
        <div className="overflow-x-auto">
          {!stats?.ultimas_atualizacoes?.length ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              Nenhuma atualização de preço ainda.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Data</th>
                  <th className="table-th">Material ID</th>
                  <th className="table-th">Preço (R$)</th>
                  <th className="table-th">Fonte</th>
                  <th className="table-th">Usuário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.ultimas_atualizacoes.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td text-gray-500">
                      {h.created_at
                        ? format(new Date(h.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                        : '–'}
                    </td>
                    <td className="table-td">#{h.material_id}</td>
                    <td className="table-td font-medium text-green-700">
                      {h.preco.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="table-td text-gray-500">{h.fonte || '–'}</td>
                    <td className="table-td text-gray-500">
                      {h.usuario?.nome || `#${h.usuario_id}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="card p-5 border-l-4 border-blue-500">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            Tipos de Projeto Suportados
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['UFV', 'BESS', 'Híbrido', 'Geração', 'Industrial'].map((t) => (
              <span key={t} className="badge-blue">{t}</span>
            ))}
          </div>
        </div>
        <div className="card p-5 border-l-4 border-green-500">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">
            Funcionalidades Ativas
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mt-2">
            <li>✓ Histórico de preços</li>
            <li>✓ BOM por revisão</li>
            <li>✓ Exportação Excel</li>
            <li>✓ Importação Excel</li>
          </ul>
        </div>
        <div className="card p-5 border-l-4 border-purple-500">
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">
            Perfis de Acesso
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mt-2">
            <li>👑 Administrador</li>
            <li>⚡ Engenharia</li>
            <li>📐 Projetista</li>
            <li>🛒 Suprimentos</li>
            <li>👁 Consulta</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
