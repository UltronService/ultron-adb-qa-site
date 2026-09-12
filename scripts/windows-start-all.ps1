# Ultron ADB QA Site — start Agent + Cloudflare Tunnel in separate windows
# Run from repo root: .\scripts\windows-start-all.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "Opening Agent window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoRoot'; .\scripts\windows-start-agent.ps1"

Start-Sleep -Seconds 5

Write-Host "Opening Tunnel window..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoRoot'; .\scripts\windows-start-tunnel.ps1"

Write-Host "Done. Agent + Tunnel running in separate windows." -ForegroundColor Green
