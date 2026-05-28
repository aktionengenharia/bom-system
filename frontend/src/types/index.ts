export interface User {
  id: number
  nome: string
  email: string
  cargo?: string
  area?: string
  login: string
  perfil: 'administrador' | 'engenharia' | 'projetista' | 'suprimentos' | 'consulta'
  status: boolean
  created_at?: string
}

export interface FamiliaMaterial {
  id: number
  nome: string
  descricao?: string
}

export interface SubfamiliaMaterial {
  id: number
  familia_id: number
  nome: string
  descricao?: string
  familia?: FamiliaMaterial
}

export interface Material {
  id: number
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
  familia?: FamiliaMaterial
  subfamilia?: SubfamiliaMaterial
  created_at?: string
  updated_at?: string
}

export interface HistoricoPreco {
  id: number
  material_id: number
  preco: number
  fonte?: string
  usuario_id?: number
  usuario?: User
  data_referencia?: string
  observacao?: string
  created_at?: string
}

export interface MaterialDetail extends Material {
  historico_precos: HistoricoPreco[]
}

export interface Cliente {
  id: number
  nome: string
  documento?: string
  email?: string
  telefone?: string
  status: boolean
}

export type TipoProjeto = 'UFV' | 'BESS' | 'Híbrido' | 'Geração' | 'Industrial'
export type StatusProjeto = 'Ativo' | 'Concluído' | 'Suspenso' | 'Cancelado'

export interface Projeto {
  id: number
  cliente_id?: number
  nome: string
  codigo_interno?: string
  tipo: TipoProjeto
  potencia_kwp?: number
  tensao?: string
  localizacao?: string
  responsavel_id?: number
  status: StatusProjeto
  observacoes?: string
  cliente?: Cliente
  responsavel?: User
  created_at?: string
  updated_at?: string
}

export interface ProjectBOMItem {
  id: number
  bom_id: number
  material_id: number
  quantidade: number
  preco_unitario: number
  observacao?: string
  material?: {
    id: number
    codigo_interno?: string
    descricao: string
    unidade: string
    preco_medio: number
    familia?: FamiliaMaterial
  }
}

export interface ProjectBOM {
  id: number
  projeto_id: number
  revisao: number
  descricao?: string
  status: string
  created_by?: number
  creator?: User
  created_at?: string
  updated_at?: string
  items: ProjectBOMItem[]
}

export interface DashboardStats {
  total_projetos: number
  projetos_ativos: number
  total_materiais: number
  materiais_ativos: number
  materiais_sem_preco: number
  ultimas_atualizacoes: HistoricoPreco[]
}

export interface Token {
  access_token: string
  token_type: string
}
