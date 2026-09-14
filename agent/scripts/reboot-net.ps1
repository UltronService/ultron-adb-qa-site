$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message)
    $line = "[$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')] $Message"
    if ($env:RUN_LOG_PATH) {
        Add-Content -Path $env:RUN_LOG_PATH -Value $line
    }
    Write-Output $line
}

if (-not $env:ADB_SERIAL) { throw "ADB_SERIAL is required" }

$timeoutSeconds = 120
$interval = 5
$elapsed = 0
$adbExe = if ($env:ADB_EXE) { $env:ADB_EXE } else { "adb" }
$serial = $env:ADB_SERIAL

Write-Log "reboot-net: reboot device"
& $adbExe -s $serial reboot 2>&1 | Out-Null

Write-Log "reboot-net: wait for device"
& $adbExe -s $serial wait-for-device 2>&1 | Out-Null

Write-Log "reboot-net: wait for boot complete"
while ($elapsed -lt $timeoutSeconds) {
    $boot = (& $adbExe -s $serial shell getprop sys.boot_completed 2>&1 | Out-String).Trim()
    if ($boot -eq "1") { break }
    Start-Sleep -Seconds $interval
    $elapsed += $interval
}

if ($elapsed -ge $timeoutSeconds) {
    Write-Log "reboot-net: FAIL — boot timeout"
    exit 1
}

Write-Log "reboot-net: ping 8.8.8.8"
$elapsed = 0
while ($elapsed -lt $timeoutSeconds) {
    $ping = & $adbExe -s $serial shell ping -c 1 -W 3 8.8.8.8 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "reboot-net: PASS — network restored in ${elapsed}s"
        exit 0
    }
    Start-Sleep -Seconds $interval
    $elapsed += $interval
}

Write-Log "reboot-net: FAIL — ping timeout"
exit 1
