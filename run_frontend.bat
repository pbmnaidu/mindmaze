@echo off
echo ==================================================
echo Starting MPLADS AI Platform Frontend (Next.js 15)
echo ==================================================
cd /d "%~dp0frontend"

echo Freeing port 3000 if occupied...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul

echo Clearing .next cache...
if exist .next rmdir /s /q .next

npm.cmd run dev
pause
