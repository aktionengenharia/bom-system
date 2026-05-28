# -*- coding: utf-8 -*-
"""
Popula o banco com dados iniciais: usuário admin e famílias de materiais.
Execute: python seed.py
"""
import sys
import os
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine
from app import models
from app.auth import get_password_hash

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ── Admin user ────────────────────────────────────────────────────────────────
if not db.query(models.User).filter(models.User.login == "admin").first():
    admin = models.User(
        nome="Administrador",
        email="admin@empresa.com.br",
        cargo="Administrador do Sistema",
        area="TI",
        login="admin",
        hashed_password=get_password_hash("admin123"),
        perfil=models.PerfilEnum.ADMINISTRADOR,
        status=True,
    )
    db.add(admin)
    print("✓ Usuário admin criado  (login: admin / senha: admin123)")

# ── Material families ─────────────────────────────────────────────────────────
familias = [
    ("Módulos Fotovoltaicos", [
        "Módulos Monocristalinos",
        "Módulos Policristalinos",
        "Módulos Bifaciais",
    ]),
    ("Inversores", [
        "Inversores String",
        "Inversores Centrais",
        "Micro-inversores",
        "Inversores Híbridos",
    ]),
    ("String Box / QGBT", [
        "String Box CC",
        "Quadros de Distribuição CA",
    ]),
    ("Estruturas de Fixação", [
        "Estruturas Solo",
        "Estruturas Telhado",
        "Rastreadores",
        "Estacas",
    ]),
    ("Cabos CC", [
        "Cabo Solar 4mm²",
        "Cabo Solar 6mm²",
        "Cabo Solar 10mm²",
    ]),
    ("Cabos CA", [
        "Cabo Baixa Tensão",
        "Cabo Média Tensão",
    ]),
    ("Conectores", [
        "Conector MC4",
        "Conector T-Branch",
    ]),
    ("SPDA / Aterramento", [
        "Para-raios",
        "Eletrodos de Aterramento",
        "Cabos de Aterramento",
    ]),
    ("Transformadores", [
        "Transformadores AT/MT",
        "Transformadores MT/BT",
        "Transformadores de Serviços Auxiliares",
    ]),
    ("Média Tensão", [
        "Cubículos MT",
        "Relés de Proteção",
        "Cabos MT",
        "Terminais MT",
    ]),
    ("BESS – Baterias", [
        "Módulos de Bateria",
        "Racks de Bateria",
        "BMS",
    ]),
    ("BESS – PCS", [
        "PCS (Power Conversion System)",
        "EMS (Energy Management System)",
    ]),
    ("BESS – Infraestrutura", [
        "Containers",
        "HVAC",
        "Painéis Auxiliares",
        "Proteção contra Incêndio",
    ]),
    ("Civil", [
        "Concreto",
        "Drenagem",
        "Cercamento",
        "Pavimentação",
    ]),
    ("EPC / Serviços", [
        "Mão de Obra",
        "Frete",
        "Comissionamento",
    ]),
]

for familia_nome, subs in familias:
    familia = db.query(models.FamiliaMaterial).filter(
        models.FamiliaMaterial.nome == familia_nome
    ).first()
    if not familia:
        familia = models.FamiliaMaterial(nome=familia_nome)
        db.add(familia)
        db.flush()
        print(f"✓ Família criada: {familia_nome}")

    for sub_nome in subs:
        sub = db.query(models.SubfamiliaMaterial).filter(
            models.SubfamiliaMaterial.familia_id == familia.id,
            models.SubfamiliaMaterial.nome == sub_nome,
        ).first()
        if not sub:
            db.add(models.SubfamiliaMaterial(familia_id=familia.id, nome=sub_nome))

# ── Sample materials ──────────────────────────────────────────────────────────
familia_modulos = db.query(models.FamiliaMaterial).filter(
    models.FamiliaMaterial.nome == "Módulos Fotovoltaicos"
).first()
familia_inversores = db.query(models.FamiliaMaterial).filter(
    models.FamiliaMaterial.nome == "Inversores"
).first()

admin_user = db.query(models.User).filter(models.User.login == "admin").first()

if familia_modulos and not db.query(models.Material).first():
    db.flush()
    materiais_exemplo = [
        models.Material(
            codigo_interno="MOD-550-MONO",
            familia_id=familia_modulos.id,
            descricao="Módulo Fotovoltaico Monocristalino 550Wp",
            fabricante="JA Solar",
            modelo="JAM72S30-550/MR",
            unidade="un",
            preco_medio=750.00,
            fonte_preco="Cotação fornecedor",
            lead_time=30,
            status=True,
            created_by=admin_user.id if admin_user else None,
        ),
        models.Material(
            codigo_interno="INV-110-STR",
            familia_id=familia_inversores.id,
            descricao="Inversor String 110kW 3F",
            fabricante="Sungrow",
            modelo="SG110CX",
            unidade="un",
            preco_medio=28500.00,
            fonte_preco="Cotação fornecedor",
            lead_time=45,
            status=True,
            created_by=admin_user.id if admin_user else None,
        ),
    ]
    for mat in materiais_exemplo:
        db.add(mat)
    print("✓ Materiais de exemplo criados")

db.commit()
db.close()

print("\n✅ Banco de dados inicializado com sucesso!")
print("   Acesse o sistema com: login=admin / senha=admin123")
