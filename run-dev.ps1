# Dev environment startup script for Windows (PowerShell)

Write-Host "--- Starting Amazon-But-With-Agents Dev Environment ---" -ForegroundColor Yellow

# Get the root directory
$RootDir = $PWD

# Start Backend
Write-Host "[1/3] Launching Backend (FastAPI)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Backend-API'; & '$RootDir\.venv\Scripts\python.exe' main.py" -WorkingDirectory "$RootDir\backend"

# Start Shopping Agent
Write-Host "[2/3] Launching Shopping Agent (LangGraph)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Shopping-Agent'; & '$RootDir\.venv\Scripts\python.exe' main.py" -WorkingDirectory "$RootDir\backend\shopping-agent"

# Start Frontend
Write-Host "[3/3] Launching Frontend (Next.js)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Frontend-NextJS'; npm run dev" -WorkingDirectory "$RootDir\frontend"

Write-Host "`nDev environment is starting up!" -ForegroundColor Yellow
Write-Host "- Backend: http://localhost:8000"
Write-Host "- Shopping Agent: http://localhost:8001"
Write-Host "- Frontend: http://localhost:3000"
Write-Host "- API Docs: http://localhost:8000/docs"
