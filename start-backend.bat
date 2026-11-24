@echo off
title CertiVerify - Backend API
echo ===================================================
echo Starting CertiVerify Express Backend (Port 5000)...
echo ===================================================
cd /d %~dp0backend
call npm start
pause

