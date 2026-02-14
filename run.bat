@echo off
echo Starting Video Downloader...

:: Start Backend
start "Video Downloader Backend" cmd /k "cd backend && venv\Scripts\activate && python app.py"

:: Start Frontend
start "Video Downloader Frontend" cmd /k "cd frontend && npm run dev"

echo Servers started!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
