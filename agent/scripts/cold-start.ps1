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
$launchActivity = if ($env:LAUNCH_ACTIVITY) { $env:LAUNCH_ACTIVITY } else { "$($env:PACKAGE_NAME)/.MainActivity" }
$adb = @("adb", "-s", $env:ADB_SERIAL)

Write-Log "cold-start: check package $($env:PACKAGE_NAME)"
$pkgPath = (& $adb shell pm path $env:PACKAGE_NAME 2>&1 | Out-String).Trim()
if (-not $pkgPath -or $pkgPath -match 'error|not found') {
    Write-Log "cold-start: FAIL package not installed on $($env:ADB_SERIAL)"
    exit 1
}

Write-Log "cold-start: force-stop $($env:PACKAGE_NAME)"
& $adb shell am force-stop $env:PACKAGE_NAME 2>&1 | Out-Null

Write-Log "cold-start: launch $launchActivity"
$startOutput = & $adb shell am start -W -n $launchActivity 2>&1
$startText = ($startOutput | Out-String).Trim()
if ($env:RUN_LOG_PATH) { Add-Content -Path $env:RUN_LOG_PATH -Value $startText }

$totalTime = $null
foreach ($line in ($startText -split "`n")) {
    if ($line -match '(TotalTime|WaitTime|ThisTime):\s*(\d+)') {
        $totalTime = [int]$Matches[2]
        break
    }
}

if (-not $totalTime) {
    Write-Log "cold-start: unable to parse launch time from am start -W output"
    exit 1
}

Write-Log "launch_time_ms=$totalTime"

if ($totalTime -gt $launchMax) {
    Write-Log "cold-start: FAIL launch time ${totalTime}ms > ${launchMax}ms"
    exit 1
}

Write-Log "cold-start: PASS"
exit 0
