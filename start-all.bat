@echo off
if not exist "%~dp0.env" (
  echo [ERROR] .env not found. Copy .env.example to .env and fill in DB info first.
  pause
  exit /b 1
)
start "BACKEND 3333" cmd /k "cd /d %~dp0backend && npm start"
start "FRONTEND 3000" cmd /k "cd /d %~dp0frontend && npm start"
