from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
async def get_stats(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    total_projetos = db.query(models.Projeto).count()
    projetos_ativos = db.query(models.Projeto).filter(
        models.Projeto.status == models.StatusProjetoEnum.ATIVO
    ).count()
    total_materiais = db.query(models.Material).count()
    materiais_ativos = db.query(models.Material).filter(models.Material.status == True).count()
    materiais_sem_preco = db.query(models.Material).filter(
        (models.Material.preco_medio == None) | (models.Material.preco_medio == 0)
    ).count()

    ultimas = (
        db.query(models.HistoricoPreco)
        .order_by(models.HistoricoPreco.created_at.desc())
        .limit(10)
        .all()
    )

    return schemas.DashboardStats(
        total_projetos=total_projetos,
        projetos_ativos=projetos_ativos,
        total_materiais=total_materiais,
        materiais_ativos=materiais_ativos,
        materiais_sem_preco=materiais_sem_preco,
        ultimas_atualizacoes=ultimas,
    )
