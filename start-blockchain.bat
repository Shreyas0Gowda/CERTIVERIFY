@echo off
title CertiVerify - Hardhat Node
echo ===================================================
echo Starting Hardhat Ethereum Localhost Node (31337)...
echo ===================================================
cd /d %~dp0blockchain
call npx hardhat node
pause

