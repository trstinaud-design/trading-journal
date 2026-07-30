@echo off
REM Lance le serveur de dev Next.js pour trading-journal.
REM Double-clique sur ce fichier pour demarrer.
REM Laisse la fenetre ouverte tant que tu utilises l'app.
REM Ctrl+C pour arreter proprement.
cd /d "%~dp0"
title Trading Journal - Dev Server
echo.
echo ===================================
echo   Trading Journal - Dev Server
echo   http://localhost:3000
echo ===================================
echo.
npm run dev
pause
