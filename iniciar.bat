@echo off
title BOM System - ATM Engenharia
echo.
echo  ============================================================
echo    BOM System - ATM Engenharia
echo    Sistema de Gestao de Lista de Materiais
echo  ============================================================
echo.
echo  [1/2] Iniciando Backend (porta 8000)...
start "Backend API" cmd /k "cd /d "%~dp0backend" && venv\Scripts\uvicorn app.main:app --reload --port 8000"
echo  [2/2] Aguardando backend subir...
timeout /t 5 /nobreak > nul
echo  [3/3] Iniciando Frontend (porta 5173)...
start "Frontend React" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 6 /nobreak > nul
echo.
echo  ============================================================
echo    Sistema pronto!
echo    Abrindo navegador em http://localhost:5173
echo.
echo    Login: admin   Senha: admin123
echo  ============================================================
echo.
start "" "http://localhost:5173"
echo  Pressione qualquer tecla para fechar esta janela...
pause > nul
