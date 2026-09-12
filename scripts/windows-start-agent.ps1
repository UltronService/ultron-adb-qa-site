# Ultron ADB QA Site — Windows agent (FastAPI) starter
# Run from repo root in a second PowerShell window: .\scripts\windows-start-agent.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$AgentDir = Join-Path $RepoRoot "agent"
$VenvActivate = Join-Path $AgentDir ".venv\Scripts\Activate.ps1"

Write-Host "Ultron ADB QA Site — starting agent..." -ForegroundColor Cyan

if (-not (Test-Path $AgentDir)) {
    Write-Host "ERROR: agent folder not found." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Python not found. Install from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

Set-Location $AgentDir

if (-not (Test-Path $VenvActivate)) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
}

& $VenvActivate
pip install -r requirements.txt -q
Write-Host "Agent running at http://127.0.0.1:8765/health" -ForegroundColor Green
uvicorn main:app --reload --host 0.0.0.0 --port 8765
