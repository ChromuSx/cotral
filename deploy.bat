@echo off
title Cotral Deploy
REM Wrapper to run deploy.sh via Git Bash
where bash >nul 2>nul
if errorlevel 1 (
    echo ERROR: bash not found in PATH. Install Git for Windows.
    pause
    exit /b 1
)
bash "%~dp0deploy.sh" %*
pause
