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

$events = if ($env:MONKEY_EVENTS) { [int]$env:MONKEY_EVENTS } else { 500 }
$adbExe = if ($env:ADB_EXE) { $env:ADB_EXE } else { "adb" }
$serial = $env:ADB_SERIAL

Write-Log "monkey-stress: clear logcat"
& $adbExe -s $serial logcat -c 2>&1 | Out-Null

Write-Log "monkey-stress: run monkey with $events events"
& $adbExe -s $serial shell monkey -p $env:PACKAGE_NAME --ignore-crashes --ignore-timeouts --ignore-security-exceptions --pct-syskeys 0 $events 2>&1 | Out-Null

Start-Sleep -Seconds 2
$logSnippet = & $adbExe -s $serial logcat -d -t 200 2>&1
$logText = ($logSnippet | Out-String)
if ($env:RUN_LOG_PATH) { Add-Content -Path $env:RUN_LOG_PATH -Value $logText }

if ($logText -match 'AndroidRuntime:\s*FATAL') {
    Write-Log "monkey-stress: FAIL — FATAL exception detected"
    exit 1
}

Write-Log "monkey-stress: PASS"
exit 0
