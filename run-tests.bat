@echo off
title CertiVerify - Automated Test Suite
echo ===================================================
echo 1. Running Smart Contract Unit Tests (Hardhat / Chai)...
echo ===================================================
cd /d %~dp0blockchain
call npx hardhat test

echo.
echo ===================================================
echo 2. Running Full End-to-End System Integration Tests...
echo ===================================================
call npx hardhat run ../scripts/testEndToEnd.js

pause

