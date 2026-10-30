@echo off
cd /d "%~dp0backend" && call npm install
cd /d "%~dp0frontend" && call npm install
echo.
echo Done. Next: copy .env.example to .env and fill DB info, then run start-all.bat
pause
