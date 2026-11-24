@echo off
title CertiVerify - Full Setup
color 0A

echo.
echo ==================================================
echo   CERTIVERIFY - FULL SETUP (Run Once)
echo ==================================================
echo.
echo This will:
echo   1. Start the Hardhat blockchain node
echo   2. Compile and deploy the smart contract
echo   3. Register sample certificates on-chain
echo   4. Start the backend API server
echo   5. Start the frontend
echo.
echo Make sure you have run "npm install" in all folders first.
echo.
pause

echo.
echo [Step 1/5] Starting Hardhat blockchain node...
start "CertiVerify Blockchain" cmd /k "cd /d %~dp0blockchain && npx hardhat node"
echo Waiting 8 seconds for node to start...
timeout /t 8 /nobreak > nul

echo.
echo [Step 2/5] Compiling smart contract...
cd /d %~dp0blockchain
call npx hardhat compile
if errorlevel 1 (
  echo ERROR: Contract compilation failed!
  pause
  exit /b 1
)
echo Contract compiled successfully.

echo.
echo [Step 3/5] Deploying contract and seeding sample certificates...
cd /d %~dp0
call node scripts/setupAndSeed.js
if errorlevel 1 (
  echo ERROR: Setup/seed script failed! Is the blockchain node running?
  pause
  exit /b 1
)

echo.
echo [Step 4/5] Starting backend API server...
start "CertiVerify Backend" cmd /k "cd /d %~dp0backend && node server.js"
echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo [Step 5/5] Starting frontend...
start "CertiVerify Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ==================================================
echo   ALL SERVICES STARTED SUCCESSFULLY!
echo ==================================================
echo.
echo   Blockchain: http://127.0.0.1:8545
echo   Backend:    http://localhost:5000
echo   Frontend:   http://localhost:5173
echo.
echo   Test certificates in: sample-certificates\
echo   Green  = Alex_Morgan_CS_Authentic.pdf
echo   Red    = Alex_Morgan_CS_Tampered.pdf
echo   Orange = Sophia_Chen_MBA_Revoked.pdf
echo   Red    = Unregistered_Certificate.pdf
echo.
echo Open http://localhost:5173 in your browser!
echo.
pause

