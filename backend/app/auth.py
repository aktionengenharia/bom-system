from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from . import models
from .config import settings
from .database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.login == username).first()
    if user is None or not user.status:
        raise credentials_exception
    return user


def can_edit(user: models.User) -> bool:
    return user.perfil in (
        models.PerfilEnum.ADMINISTRADOR,
        models.PerfilEnum.ENGENHARIA,
        models.PerfilEnum.PROJETISTA,
    )


def can_update_prices(user: models.User) -> bool:
    return user.perfil in (
        models.PerfilEnum.ADMINISTRADOR,
        models.PerfilEnum.ENGENHARIA,
        models.PerfilEnum.SUPRIMENTOS,
    )


def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.perfil != models.PerfilEnum.ADMINISTRADOR:
        raise HTTPException(status_code=403, detail="Permissão de administrador necessária")
    return current_user
