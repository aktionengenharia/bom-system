from __future__ import annotations
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PerfilEnum(str, Enum):
    ADMINISTRADOR = "administrador"
    ENGENHARIA = "engenharia"
    PROJETISTA = "projetista"
    SUPRIMENTOS = "suprimentos"
    CONSULTA = "consulta"


class TipoProjetoEnum(str, Enum):
    UFV = "UFV"
    BESS = "BESS"
    HIBRIDO = "Híbrido"
    GERACAO = "Geração"
    INDUSTRIAL = "Industrial"


class StatusProjetoEnum(str, Enum):
    ATIVO = "Ativo"
    CONCLUIDO = "Concluído"
    SUSPENSO = "Suspenso"
    CANCELADO = "Cancelado"


# ── Auth ──────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str


# ── Users ─────────────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    nome: str
    email: EmailStr
    cargo: Optional[str] = None
    area: Optional[str] = None
    login: str
    perfil: PerfilEnum = PerfilEnum.CONSULTA
    status: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    cargo: Optional[str] = None
    area: Optional[str] = None
    perfil: Optional[PerfilEnum] = None
    status: Optional[bool] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Families ──────────────────────────────────────────────────────────────────

class FamiliaCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None


class FamiliaResponse(BaseModel):
    id: int
    nome: str
    descricao: Optional[str] = None

    class Config:
        from_attributes = True


class SubfamiliaCreate(BaseModel):
    familia_id: int
    nome: str
    descricao: Optional[str] = None


class SubfamiliaResponse(BaseModel):
    id: int
    familia_id: int
    nome: str
    descricao: Optional[str] = None
    familia: Optional[FamiliaResponse] = None

    class Config:
        from_attributes = True


# ── Materials ─────────────────────────────────────────────────────────────────

class MaterialBase(BaseModel):
    codigo_interno: Optional[str] = None
    familia_id: int
    subfamilia_id: Optional[int] = None
    descricao: str
    fabricante: Optional[str] = None
    modelo: Optional[str] = None
    unidade: str = "un"
    preco_medio: float = 0.0
    status: bool = True
    fonte_preco: Optional[str] = None
    lead_time: Optional[int] = None
    observacoes: Optional[str] = None


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    codigo_interno: Optional[str] = None
    familia_id: Optional[int] = None
    subfamilia_id: Optional[int] = None
    descricao: Optional[str] = None
    fabricante: Optional[str] = None
    modelo: Optional[str] = None
    unidade: Optional[str] = None
    preco_medio: Optional[float] = None
    status: Optional[bool] = None
    fonte_preco: Optional[str] = None
    lead_time: Optional[int] = None
    observacoes: Optional[str] = None


class MaterialResponse(MaterialBase):
    id: int
    familia: Optional[FamiliaResponse] = None
    subfamilia: Optional[SubfamiliaResponse] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MaterialSimple(BaseModel):
    id: int
    codigo_interno: Optional[str] = None
    descricao: str
    unidade: str
    preco_medio: float
    familia: Optional[FamiliaResponse] = None

    class Config:
        from_attributes = True


# ── Price History ─────────────────────────────────────────────────────────────

class HistoricoPrecoCreate(BaseModel):
    preco: float
    fonte: Optional[str] = None
    data_referencia: Optional[datetime] = None
    observacao: Optional[str] = None


class HistoricoPrecoResponse(BaseModel):
    id: int
    material_id: int
    preco: float
    fonte: Optional[str] = None
    usuario_id: Optional[int] = None
    usuario: Optional[UserResponse] = None
    data_referencia: Optional[datetime] = None
    observacao: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MaterialDetail(MaterialResponse):
    historico_precos: List[HistoricoPrecoResponse] = []


# ── Clients ───────────────────────────────────────────────────────────────────

class ClienteCreate(BaseModel):
    nome: str
    documento: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    status: bool = True


class ClienteResponse(BaseModel):
    id: int
    nome: str
    documento: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    status: bool

    class Config:
        from_attributes = True


# ── Projects ──────────────────────────────────────────────────────────────────

class ProjetoCreate(BaseModel):
    cliente_id: Optional[int] = None
    nome: str
    codigo_interno: Optional[str] = None
    tipo: TipoProjetoEnum
    potencia_kwp: Optional[float] = None
    tensao: Optional[str] = None
    localizacao: Optional[str] = None
    responsavel_id: Optional[int] = None
    status: StatusProjetoEnum = StatusProjetoEnum.ATIVO
    observacoes: Optional[str] = None


class ProjetoUpdate(BaseModel):
    cliente_id: Optional[int] = None
    nome: Optional[str] = None
    codigo_interno: Optional[str] = None
    tipo: Optional[TipoProjetoEnum] = None
    potencia_kwp: Optional[float] = None
    tensao: Optional[str] = None
    localizacao: Optional[str] = None
    responsavel_id: Optional[int] = None
    status: Optional[StatusProjetoEnum] = None
    observacoes: Optional[str] = None


class ProjetoResponse(BaseModel):
    id: int
    cliente_id: Optional[int] = None
    nome: str
    codigo_interno: Optional[str] = None
    tipo: TipoProjetoEnum
    potencia_kwp: Optional[float] = None
    tensao: Optional[str] = None
    localizacao: Optional[str] = None
    responsavel_id: Optional[int] = None
    status: StatusProjetoEnum
    observacoes: Optional[str] = None
    cliente: Optional[ClienteResponse] = None
    responsavel: Optional[UserResponse] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── BOM ───────────────────────────────────────────────────────────────────────

class ProjectBOMItemCreate(BaseModel):
    material_id: int
    quantidade: float
    preco_unitario: float
    observacao: Optional[str] = None


class ProjectBOMItemUpdate(BaseModel):
    quantidade: Optional[float] = None
    preco_unitario: Optional[float] = None
    observacao: Optional[str] = None


class ProjectBOMItemResponse(BaseModel):
    id: int
    bom_id: int
    material_id: int
    quantidade: float
    preco_unitario: float
    observacao: Optional[str] = None
    material: Optional[MaterialSimple] = None

    class Config:
        from_attributes = True


class ProjectBOMCreate(BaseModel):
    descricao: Optional[str] = None
    status: str = "Em elaboração"


class ProjectBOMResponse(BaseModel):
    id: int
    projeto_id: int
    revisao: int
    descricao: Optional[str] = None
    status: str
    created_by: Optional[int] = None
    creator: Optional[UserResponse] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: List[ProjectBOMItemResponse] = []

    class Config:
        from_attributes = True


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_projetos: int
    projetos_ativos: int
    total_materiais: int
    materiais_ativos: int
    materiais_sem_preco: int
    ultimas_atualizacoes: List[HistoricoPrecoResponse] = []
