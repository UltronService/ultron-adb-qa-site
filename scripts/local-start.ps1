# Ultron ADB QA Site — local-first one-click (Windows)
# Run from repo root: .\scripts\local-start.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "Ultron ADB QA Site - local start" -ForegroundColor Cyan
Write-Host "Repo: $RepoRoot" -ForegroundColor Gray

$agentScript = Join-Path $RepoRoot "scripts\windows-start-agent.ps1"
$frontendScript = Join-Path $RepoRoot "scripts\windows-start.ps1"

if (-not (Test-Path $agentScript)) {
    Write-Host "ERROR: missing $agentScript" -ForegroundColor Red
    exit 1
}

Write-Host "Starting Agent in a new window (port 8765)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $agentScript

Write-Host "Waiting for Agent health..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:8765/health" -TimeoutSec 2
        if ($health) {
            $ready = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $ready) {
    Write-Host "WARN: Agent not ready yet; frontend will still start." -ForegroundColor Yellow
} else {
    Write-Host "OK: Agent is up at http://127.0.0.1:8765/health" -ForegroundColor Green
}

Write-Host "Starting Frontend in this window (port 43123)..." -ForegroundColor Yellow
& $frontendScript
