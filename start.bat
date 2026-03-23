@echo off
echo ===================================================
echo Starting LinkedIn Intelligence Dashboard...
echo ===================================================

echo [1/2] Starting Python Backend Server (Port 8001)...
cd backend
start "LinkedIn Backend" cmd /c "python -m uvicorn server:app --host 0.0.0.0 --port 8001"

echo [2/2] Starting React Frontend Server (Port 3000)...
cd ../frontend
start "LinkedIn Frontend" cmd /c "npm start"

echo.
echo ===================================================
echo Both servers are launching in separate windows!
echo Please keep those black command windows open while 
echo using the dashboard.
echo.
echo You can access the UI at: http://localhost:3000
echo ===================================================
pause
