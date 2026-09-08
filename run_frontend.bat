@echo off
echo ==================================================
echo Starting MPLADS AI Platform Frontend (Next.js 15)
echo ==================================================
cd /d "%~dp0frontend"
if exist .next rmdir /s /q .next
npm.cmd run dev
pause
