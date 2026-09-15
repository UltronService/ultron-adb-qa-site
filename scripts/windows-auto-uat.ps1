# One-click cold-start UAT via Agent API (Windows)
# Usage: .\scripts\windows-auto-uat.ps1
# Keep Agent running on :8765 before executing.

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RepoRoot

Write-Host "=== Ultron auto UAT (cold start) ===" -ForegroundColor Cyan

try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8765/health" -TimeoutSec 5
    Write-Host "Agent OK: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Agent not running. Run .\scripts\windows-start-agent.ps1 first." -ForegroundColor Red
    exit 1
}

$payload = @{
    template_id = "cold-start"
    device_ids  = @("192.168.1.176:5555", "192.168.1.148:5555")
    params      = @{
        package_name       = "com.ultron.player"
        launch_activity    = "com.ultron.player/.MainActivity"
        launch_time_max_ms = "5000"
    }
} | ConvertTo-Json -Depth 4 -Compress

Write-Host "Starting cold-start on both STBs..." -ForegroundColor Yellow
$run = Invoke-RestMethod -Uri "http://127.0.0.1:8765/api/automation/run" `
    -Method POST -Body $payload -ContentType "application/json; charset=utf-8"

Write-Host "Run ID: $($run.run_id)" -ForegroundColor Gray

do {
    Start-Sleep -Seconds 2
    $status = Invoke-RestMethod -Uri "http://127.0.0.1:8765/api/automation/runs/$($run.run_id)"
    Clear-Host
    Write-Host "Run: $($run.run_id)  State: $($status.state)" -ForegroundColor Cyan
    $status.progress | Format-Table device_label, step, status -AutoSize
} while ($status.state -eq "running")

Write-Host "`n=== Reports ===" -ForegroundColor Cyan
$reports = Invoke-RestMethod -Uri "http://127.0.0.1:8765/api/reports"
if ($reports.Count -eq 0) {
    Write-Host "No reports yet. Check agent\data\runs\$($run.run_id)\logs" -ForegroundColor Yellow
} else {
    $reports | Format-Table id, date, template, pass_count, fail_count -AutoSize
}

Write-Host "`nDone. Open http://localhost:43124/reports in browser (start frontend if needed)." -ForegroundColor Green
