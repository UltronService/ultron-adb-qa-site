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
if (-not $env:PACKAGE_NAME) { throw "PACKAGE_NAME is required" }

$launchMax = if ($env:LAUNCH_TIME_MAX_MS) { [int]$env:LAUNCH_TIME_MAX_MS } else { 3000 }
$adb = @("adb", "-s", $env:ADB_SERIAL)

Write-Log "cold-start: force-stop $env:PACKAGE_NAME"
& $adb shell am force-stop $env:PACKAGE_NAME 2>&1 | Out-Null

Write-Log "cold-start: launch $env:PACKAGE_NAME"
& $adb shell monkey -p $env:PACKAGE_NAME -c android.intent.category.LAUNCHER 1 2>&1 | Out-Null

$startOutput = & $adb shell am start -W -a android.intent.action.MAIN -c android.intent.category.LAUNCHER $env:PACKAGE_NAME 2>&1
$startText = ($startOutput | Out-String).Trim()
if ($env:RUN_LOG_PATH) { Add-Content -Path $env:RUN_LOG_PATH -Value $startText }

$totalTime = $null
foreach ($line in ($startText -split "`n")) {
    if ($line -match 'TotalTime:\s*(\d+)') {
        $totalTime = [int]$Matches[1]
        break
    }
}

if (-not $totalTime) {
    Write-Log "cold-start: unable to parse TotalTime"
    exit 1
}

Write-Log "launch_time_ms=$totalTime"

if ($totalTime -gt $launchMax) {
    Write-Log "cold-start: FAIL TotalTime ${totalTime}ms > ${launchMax}ms"
    exit 1
}

Write-Log "cold-start: PASS"
exit 0
