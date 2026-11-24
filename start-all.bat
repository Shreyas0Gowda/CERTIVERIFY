@echo off
title CertiVerify - System Launcher
color 0A

echo.
echo  ============================================================
echo   CERTIVERIFY - Starting All Services
echo  ============================================================
echo.
echo  STEP 1: Starting Hardhat Blockchain Node...
echo  (A new window will open - keep it running)
echo.

start "Blockchain Node" cmd /k "title Blockchain Node && cd /d "%~dp0blockchain" && npx hardhat node"

echo  Waiting 12 seconds for the blockchain node to start...
echo  (Watch the Blockchain Node window for "Started HTTP..." message)
echo.
timeout /t 12 /nobreak > nul

echo  STEP 2: Starting Backend API Server...
echo  (A new window will open - keep it running)
echo.

start "Backend API" cmd /k "title Backend API && cd /d "%~dp0backend" && node server.js"

echo  Waiting 5 seconds for backend to start and deploy contract...
timeout /t 5 /nobreak > nul

echo  STEP 3: Starting Frontend...
echo  (A new window will open - keep it running)
echo.

start "Frontend" cmd /k "title Frontend && cd /d "%~dp0frontend" && npm run dev"

echo.
echo  ============================================================
echo   ALL SERVICES STARTED!
echo  ============================================================
echo.
echo   Open this URL in your browser:
echo   http://localhost:5173/verify
echo.
echo   Test certificates are in: sample-certificates\
echo   - Alex_Morgan_CS_Authentic.pdf   = GREEN (Authentic)
echo   - Alex_Morgan_CS_Tampered.pdf    = RED   (Invalid)
echo   - Sophia_Chen_MBA_Revoked.pdf    = ORANGE(Revoked)
echo   - Unregistered_Certificate.pdf   = RED   (Invalid)
echo.
echo   Admin Login: http://localhost:5173/login
echo   Username: admin   Password: AdminPassword123!
echo.
echo   NOTE: Wait for the Backend window to show:
echo   "[Blockchain] Auto-deploy attempt 1/5..." 
echo   "[Blockchain] Contract deployed successfully"
echo   "[Auto-Seed] Registering Alex Morgan..."
echo   BEFORE testing verification!
echo.
pause
