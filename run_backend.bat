@echo off
echo ==================================================
echo Starting MPLADS AI Platform Backend Server (FastAPI)
echo ==================================================
cd /d "%~dp0"
python -m uvicorn src.backend.app:app --host 127.0.0.1 --port 8000 --reload
pause
