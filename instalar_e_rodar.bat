@echo off
title BOM System - Instalacao
echo.
echo  ============================================================
echo    BOM System - Instalacao do Sistema
echo  ============================================================
echo.

cd /d "%~dp0"

echo  [BACKEND] Verificando ambiente virtual Python...
if not exist "backend\venv\Scripts\python.exe" (
    echo  Criando ambiente virtual...
    cd backend
    python -m venv venv
    cd ..
)
echo  OK - Ambiente virtual pronto.

echo.
echo  [BACKEND] Instalando dependencias Python...
cd backend
venv\Scripts\pip install -r requirements.txt --prefer-binary -q
echo  OK - Dependencias Python instaladas.

echo.
echo  [BACKEND] Verificando banco de dados...
if not exist "bom_system.db" (
    echo  Inicializando banco de dados...
    venv\Scripts\python seed.py
    echo  OK - Banco de dados criado.
) else (
    echo  OK - Banco de dados ja existe.
)
cd ..

echo.
echo  [FRONTEND] Instalando dependencias Node.js...
cd frontend
npm install
echo  OK - Dependencias Node.js instaladas.
cd ..

echo.
echo  ============================================================
echo    Instalacao concluida!
echo    Login: admin   Senha: admin123
echo  ============================================================
echo.
choice /C SN /M "Deseja iniciar o sistema agora?"
if errorlevel 2 goto fim
call iniciar.bat
:fim
pause
