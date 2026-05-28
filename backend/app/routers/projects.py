from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api", tags=["projects"])

EDIT_ROLES = (
    models.PerfilEnum.ADMINISTRADOR,
    models.PerfilEnum.ENGENHARIA,
    models.PerfilEnum.PROJETISTA,
)


# ── Clients ───────────────────────────────────────────────────────────────────

@router.get("/clientes", response_model=List[schemas.ClienteResponse])
async def list_clientes(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    return db.query(models.Cliente).order_by(models.Cliente.nome).all()


@router.post("/clientes", response_model=schemas.ClienteResponse)
async def create_cliente(
    cliente: schemas.ClienteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.perfil not in EDIT_ROLES:
        raise HTTPException(status_code=403, detail="Permissão insuficiente")
    db_cliente = models.Cliente(**cliente.model_dump())
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente


@router.put("/clientes/{cliente_id}", response_model=schemas.ClienteResponse)
async def update_cliente(
    cliente_id: int,
    cliente: schemas.ClienteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.perfil not in EDIT_ROLES:
        raise HTTPException(status_code=403, detail="Permissão insuficiente")
    db_cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    for key, value in cliente.model_dump().items():
        setattr(db_cliente, key, value)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente


# ── Projects ──────────────────────────────────────────────────────────────────

@router.get("/projetos", response_model=List[schemas.ProjetoResponse])
async def list_projetos(
    status: Optional[str] = None,
    tipo: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    query = db.query(models.Projeto)
    if status:
        query = query.filter(models.Projeto.status == status)
    if tipo:
        query = query.filter(models.Projeto.tipo == tipo)
    if search:
        query = query.filter(
            models.Projeto.nome.ilike(f"%{search}%")
            | models.Projeto.codigo_interno.ilike(f"%{search}%")
        )
    return query.order_by(models.Projeto.created_at.desc()).all()


@router.post("/projetos", response_model=schemas.ProjetoResponse)
async def create_projeto(
    projeto: schemas.ProjetoCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.perfil not in EDIT_ROLES:
        raise HTTPException(status_code=403, detail="Permissão insuficiente")

    if projeto.codigo_interno:
        existing = db.query(models.Projeto).filter(
            models.Projeto.codigo_interno == projeto.codigo_interno
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Código interno já existe")

    db_projeto = models.Projeto(**projeto.model_dump())
    db.add(db_projeto)
    db.commit()
    db.refresh(db_projeto)
    return db_projeto


@router.get("/projetos/{projeto_id}", response_model=schemas.ProjetoResponse)
async def get_projeto(
    projeto_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return projeto


@router.put("/projetos/{projeto_id}", response_model=schemas.ProjetoResponse)
async def update_projeto(
    projeto_id: int,
    projeto: schemas.ProjetoUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.perfil not in EDIT_ROLES:
        raise HTTPException(status_code=403, detail="Permissão insuficiente")

    db_projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()
    if not db_projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    for key, value in projeto.model_dump(exclude_unset=True).items():
        setattr(db_projeto, key, value)

    db.commit()
    db.refresh(db_projeto)
    return db_projeto


@router.delete("/projetos/{projeto_id}")
async def delete_projeto(
    projeto_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    db_projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()
    if not db_projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    db.delete(db_projeto)
    db.commit()
    return {"message": "Projeto excluído"}
