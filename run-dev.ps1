# Dev environment startup script for Windows (PowerShell)

Write-Host "--- Starting Amazon-But-With-Agents Dev Environment ---" -ForegroundColor Yellow

# Start Backend
Write-Host "[1/2] Launching Backend (FastAPI)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Backend-API'; ..\.venv\Scripts\python.exe main.py" -WorkingDirectory "$PWD\backend"

# Start Frontend
Write-Host "[2/2] Launching Frontend (Next.js)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Frontend-NextJS'; npm run dev" -WorkingDirectory "$PWD\frontend"

Write-Host "`nDev environment is starting up!" -ForegroundColor Yellow
Write-Host "- Backend: http://localhost:8000"
Write-Host "- Frontend: http://localhost:3000"
Write-Host "- API Docs: http://localhost:8000/docs"
