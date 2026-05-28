import enum
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean,
    ForeignKey, Text, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class PerfilEnum(str, enum.Enum):
    ADMINISTRADOR = "administrador"
    ENGENHARIA = "engenharia"
    PROJETISTA = "projetista"
    SUPRIMENTOS = "suprimentos"
    CONSULTA = "consulta"


class TipoProjetoEnum(str, enum.Enum):
    UFV = "UFV"
    BESS = "BESS"
    HIBRIDO = "Híbrido"
    GERACAO = "Geração"
    INDUSTRIAL = "Industrial"


class StatusProjetoEnum(str, enum.Enum):
    ATIVO = "Ativo"
    CONCLUIDO = "Concluído"
    SUSPENSO = "Suspenso"
    CANCELADO = "Cancelado"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    cargo = Column(String(100))
    area = Column(String(100))
    login = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    perfil = Column(SAEnum(PerfilEnum), default=PerfilEnum.CONSULTA, nullable=False)
    status = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False)
    documento = Column(String(50))
    email = Column(String(255))
    telefone = Column(String(50))
    status = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    projetos = relationship("Projeto", back_populates="cliente")


class Projeto(Base):
    __tablename__ = "projetos"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    nome = Column(String(200), nullable=False)
    codigo_interno = Column(String(50), unique=True, index=True)
    tipo = Column(SAEnum(TipoProjetoEnum), nullable=False)
    potencia_kwp = Column(Float)
    tensao = Column(String(50))
    localizacao = Column(String(200))
    responsavel_id = Column(Integer, ForeignKey("users.id"))
    status = Column(SAEnum(StatusProjetoEnum), default=StatusProjetoEnum.ATIVO)
    observacoes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    cliente = relationship("Cliente", back_populates="projetos")
    responsavel = relationship("User", foreign_keys=[responsavel_id])
    boms = relationship("ProjectBOM", back_populates="projeto", order_by="ProjectBOM.revisao.desc()")


class FamiliaMaterial(Base):
    __tablename__ = "familias_material"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False, unique=True)
    descricao = Column(Text)

    subfamilias = relationship("SubfamiliaMaterial", back_populates="familia")
    materiais = relationship("Material", back_populates="familia")


class SubfamiliaMaterial(Base):
    __tablename__ = "subfamilias_material"

    id = Column(Integer, primary_key=True, index=True)
    familia_id = Column(Integer, ForeignKey("familias_material.id"), nullable=False)
    nome = Column(String(100), nullable=False)
    descricao = Column(Text)

    familia = relationship("FamiliaMaterial", back_populates="subfamilias")
    materiais = relationship("Material", back_populates="subfamilia")


class Material(Base):
    __tablename__ = "materiais"

    id = Column(Integer, primary_key=True, index=True)
    codigo_interno = Column(String(50), unique=True, index=True)
    familia_id = Column(Integer, ForeignKey("familias_material.id"), nullable=False)
    subfamilia_id = Column(Integer, ForeignKey("subfamilias_material.id"), nullable=True)
    descricao = Column(String(500), nullable=False)
    fabricante = Column(String(150))
    modelo = Column(String(150))
    unidade = Column(String(20), nullable=False, default="un")
    preco_medio = Column(Float, default=0.0)
    status = Column(Boolean, default=True)
    fonte_preco = Column(String(200))
    lead_time = Column(Integer)
    observacoes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    familia = relationship("FamiliaMaterial", back_populates="materiais")
    subfamilia = relationship("SubfamiliaMaterial", back_populates="materiais")
    creator = relationship("User", foreign_keys=[created_by])
    historico_precos = relationship(
        "HistoricoPreco",
        back_populates="material",
        order_by="HistoricoPreco.created_at.desc()",
    )


class HistoricoPreco(Base):
    __tablename__ = "historico_precos"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materiais.id"), nullable=False)
    preco = Column(Float, nullable=False)
    fonte = Column(String(200))
    usuario_id = Column(Integer, ForeignKey("users.id"))
    data_referencia = Column(DateTime(timezone=True))
    observacao = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    material = relationship("Material", back_populates="historico_precos")
    usuario = relationship("User", foreign_keys=[usuario_id])


class ProjectBOM(Base):
    __tablename__ = "project_bom"

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(Integer, ForeignKey("projetos.id"), nullable=False)
    revisao = Column(Integer, default=1)
    descricao = Column(String(200))
    status = Column(String(50), default="Em elaboração")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    projeto = relationship("Projeto", back_populates="boms")
    creator = relationship("User", foreign_keys=[created_by])
    items = relationship("ProjectBOMItem", back_populates="bom", cascade="all, delete-orphan")


class ProjectBOMItem(Base):
    __tablename__ = "project_bom_items"

    id = Column(Integer, primary_key=True, index=True)
    bom_id = Column(Integer, ForeignKey("project_bom.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materiais.id"), nullable=False)
    quantidade = Column(Float, nullable=False)
    preco_unitario = Column(Float, nullable=False)
    observacao = Column(Text)

    bom = relationship("ProjectBOM", back_populates="items")
    material = relationship("Material")
