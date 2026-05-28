from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/", response_model=List[schemas.UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.perfil != models.PerfilEnum.ADMINISTRADOR:
        raise HTTPException(status_code=403, detail="Permissão insuficiente")
    return db.query(models.User).order_by(models.User.nome).all()


@router.post("/", response_model=schemas.UserResponse)
async def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    if db.query(models.User).filter(models.User.login == user.login).first():
        raise HTTPException(status_code=400, detail="Login já existe")
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    data = user.model_dump(exclude={"password"})
    db_user = models.User(**data, hashed_password=auth.get_password_hash(user.password))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.put("/{user_id}", response_model=schemas.UserResponse)
async def update_user(
    user_id: int,
    user: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.perfil != models.PerfilEnum.ADMINISTRADOR and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Permissão insuficiente")

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    update_data = user.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = auth.get_password_hash(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Não é possível excluir o próprio usuário")

    db.delete(db_user)
    db.commit()
    return {"message": "Usuário excluído"}
