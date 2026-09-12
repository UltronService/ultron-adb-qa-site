# Ultron ADB QA Site — Cloudflare Tunnel to local Agent (port 8765)
# Run from repo root AFTER agent is running: .\scripts\windows-start-tunnel.ps1
#
# Modes:
#   Quick (default): random https://xxx.trycloudflare.com URL — good for testing
#   Named: set $env:CLOUDFLARE_TUNNEL_NAME = "ultron-qa-agent" and configure config/cloudflared.example.yml

$ErrorActionPreference = "Stop"
$AgentPort = 8765

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: cloudflared not found." -ForegroundColor Red
    Write-Host "Install: winget install Cloudflare.cloudflared" -ForegroundColor Yellow
    Write-Host "Or: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/" -ForegroundColor Yellow
    exit 1
}

$health = $null
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:$AgentPort/health" -TimeoutSec 3
} catch {
    Write-Host "WARNING: Agent not responding on port $AgentPort." -ForegroundColor Yellow
    Write-Host "Start agent first: .\scripts\windows-start-agent.ps1" -ForegroundColor Yellow
}

if ($health) {
    Write-Host "Agent OK: $($health | ConvertTo-Json -Compress)" -ForegroundColor Green
}

$namedTunnel = $env:CLOUDFLARE_TUNNEL_NAME

if ($namedTunnel) {
    Write-Host "Starting named tunnel: $namedTunnel" -ForegroundColor Cyan
    cloudflared tunnel run $namedTunnel
} else {
    Write-Host "Starting quick tunnel -> http://127.0.0.1:$AgentPort" -ForegroundColor Cyan
    Write-Host "Copy the https://*.trycloudflare.com URL into GitHub secret VITE_AGENT_URL" -ForegroundColor Yellow
    cloudflared tunnel --url "http://127.0.0.1:$AgentPort"
}
