@echo off
title CertiVerify - Frontend React Vite
echo ===================================================
echo Starting CertiVerify Frontend (Port 5173)...
echo ===================================================
cd /d %~dp0frontend
call npm run dev
pause

