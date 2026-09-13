# 修復 05dd5b0 Agent 無法啟動（runs export FastAPI 型別）
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$RunsPy = Join-Path $RepoRoot "agent\routers\runs.py"

if (-not (Test-Path $RunsPy)) { exit 0 }

$content = Get-Content $RunsPy -Raw
if ($content -notmatch 'HTMLResponse \| JSONResponse') { exit 0 }

Write-Host "Applying runs export hotfix..." -ForegroundColor Yellow
$content = $content -replace 'from fastapi.responses import FileResponse, HTMLResponse, JSONResponse',
  'from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response'
$content = $content -replace '@router.get\("/\{run_id\}/export"\)',
  '@router.get("/{run_id}/export", response_model=None)'
$content = $content -replace '\) -> HTMLResponse \| JSONResponse:',
  ') -> Response:'
Set-Content -Path $RunsPy -Value $content -NoNewline
Write-Host "Hotfix applied." -ForegroundColor Green
