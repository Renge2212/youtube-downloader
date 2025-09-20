@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo YouTube Downloader Production Startup
echo ========================================

REM Navigate to backend directory
cd backend

REM Activate virtual environment
call venv\Scripts\activate

REM Install required packages
echo Installing required packages...
pip install -r requirements.txt

REM Start Waitress server (Windows compatible WSGI server)
echo Starting Waitress server...
python -c "from waitress import serve; from app import app; serve(app, host='127.0.0.1', port=5000)"

REM Deactivate virtual environment
deactivate

pause
