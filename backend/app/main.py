from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine, Base
from . import models  # noqa: F401 – needed for table creation
from .routers import auth, users, materials, projects, bom, dashboard

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema BOM – Gestão de Lista de Materiais",
    description="Plataforma de gerenciamento de BOM para projetos fotovoltaicos, BESS e geração elétrica",
    version="1.0.0",
)

# CORS: lê as origens da variável de ambiente (suporta localhost + GitHub Pages + domínio custom)
allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(materials.router)
app.include_router(projects.router)
app.include_router(bom.router)
app.include_router(dashboard.router)


@app.get("/")
async def root():
    return {"message": "Sistema BOM API v1.0", "docs": "/docs"}
