$ErrorActionPreference = "Continue"

function Write-Log {
    param([string]$Message)
    $line = "[$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')] $Message"
    if ($env:RUN_LOG_PATH) {
        Add-Content -Path $env:RUN_LOG_PATH -Value $line
    }
    Write-Output $line
}

if (-not $env:ADB_SERIAL) { throw "ADB_SERIAL is required" }
if (-not $env:PACKAGE_NAME) { throw "PACKAGE_NAME is required" }

$launchMax = if ($env:LAUNCH_TIME_MAX_MS) { [int]$env:LAUNCH_TIME_MAX_MS } else { 5000 }
$adbExe = if ($env:ADB_EXE) { $env:ADB_EXE } else { "adb" }
$serial = $env:ADB_SERIAL

Write-Log "cold-start: check package $($env:PACKAGE_NAME)"
$pkgPath = (& $adbExe -s $serial shell pm path $env:PACKAGE_NAME 2>&1 | Out-String).Trim()
if (-not $pkgPath -or $pkgPath -match 'error|not found') {
    Write-Log "cold-start: FAIL package not installed on $serial"
    exit 1
}

$launchActivity = $env:LAUNCH_ACTIVITY
if (-not $launchActivity) {
    $resolved = (& $adbExe -s $serial shell cmd package resolve-activity --brief $env:PACKAGE_NAME 2>&1 | Out-String).Trim()
    $lines = $resolved -split "`n" | Where-Object { $_.Trim().Length -gt 0 }
    if ($lines.Count -ge 2) {
        $launchActivity = $lines[-1].Trim()
    } else {
        $launchActivity = "$($env:PACKAGE_NAME)/.MainActivity"
    }
}

Write-Log "cold-start: using component $launchActivity"
Write-Log "cold-start: force-stop $($env:PACKAGE_NAME)"
& $adbExe -s $serial shell am force-stop $env:PACKAGE_NAME 2>&1 | Out-Null

Write-Log "cold-start: launch"
$startOutput = & $adbExe -s $serial shell am start -W -n $launchActivity 2>&1
$startText = ($startOutput | Out-String).Trim()
if ($env:RUN_LOG_PATH) { Add-Content -Path $env:RUN_LOG_PATH -Value $startText }

$totalTime = $null
foreach ($line in ($startText -split "`n")) {
    if ($line -match '(TotalTime|WaitTime|ThisTime|LaunchState)[:\s]+(\d+)') {
        if ($Matches[1] -eq 'LaunchState') { continue }
        $totalTime = [int]$Matches[2]
        break
    }
}

if (-not $totalTime) {
    Write-Log "cold-start: unable to parse launch time; output was: $startText"
    exit 1
}

Write-Log "launch_time_ms=$totalTime"

if ($totalTime -gt $launchMax) {
    Write-Log "cold-start: FAIL launch time ${totalTime}ms > ${launchMax}ms"
    exit 1
}

Write-Log "cold-start: PASS"
exit 0
