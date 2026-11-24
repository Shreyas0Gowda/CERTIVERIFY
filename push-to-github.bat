@echo off
title CertiVerify - Push to GitHub
color 0B

echo ===================================================
echo     CERTIVERIFY: PUSH TO GITHUB
echo ===================================================
echo.
echo Your GitHub username: Shreyas0Gowda
echo.
echo BEFORE RUNNING THIS:
echo 1. Open your browser and go to: https://github.com/new
echo 2. Repository name: CERTIVERIFY (or your chosen name)
echo 3. Keep it Public or Private
echo 4. Leave "Add README", ".gitignore", and "license" UNCHECKED
echo 5. Click "Create repository"
echo.
echo ===================================================
set /p REPO_NAME="Enter your GitHub repo name [default: CERTIVERIFY]: "
if "%REPO_NAME%"=="" set REPO_NAME=CERTIVERIFY

set REMOTE_URL=https://github.com/Shreyas0Gowda/%REPO_NAME%.git
echo.
echo Target Remote URL: %REMOTE_URL%
echo.

git remote remove origin 2>nul
git remote add origin %REMOTE_URL%
git branch -M main

echo Pushing code to GitHub...
echo (A GitHub login window may pop up in your browser - approve it to proceed)
echo.

git push -u origin main

if errorlevel 1 (
    echo.
    echo ===================================================
    echo Push encountered an issue.
    echo Make sure:
    echo 1. You created the repository on https://github.com/new
    echo 2. The repo name matches: %REPO_NAME%
    echo 3. You signed in when prompted by Git Credential Manager
    echo ===================================================
) else (
    echo.
    echo ===================================================
    echo SUCCESS! Code successfully pushed to GitHub!
    echo URL: https://github.com/Shreyas0Gowda/%REPO_NAME%
    echo ===================================================
)

echo.
pause
