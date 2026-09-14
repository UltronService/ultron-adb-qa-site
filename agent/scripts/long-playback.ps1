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

$durationMinutes = if ($env:DURATION_MINUTES) { [int]$env:DURATION_MINUTES } else { 30 }
$intervalSeconds = 30
$totalSeconds = $durationMinutes * 60
$elapsed = 0
$adb = @("adb", "-s", $env:ADB_SERIAL)

Write-Log "long-playback: launch $env:PACKAGE_NAME"
& $adb shell monkey -p $env:PACKAGE_NAME -c android.intent.category.LAUNCHER 1 2>&1 | Out-Null
& $adb logcat -c 2>&1 | Out-Null

Write-Log "long-playback: monitor for $durationMinutes minutes"
while ($elapsed -lt $totalSeconds) {
    $pidOut = & $adb shell pidof $env:PACKAGE_NAME 2>&1
    if (-not $pidOut -or ($pidOut | Out-String).Trim().Length -eq 0) {
        Write-Log "long-playback: FAIL — process not running after ${elapsed}s"
        exit 1
    }

    $logSnippet = & $adb logcat -d -t 50 2>&1
    $logText = ($logSnippet | Out-String)
    if ($logText -match 'AndroidRuntime:\s*FATAL|ANR in') {
        if ($env:RUN_LOG_PATH) { Add-Content -Path $env:RUN_LOG_PATH -Value $logText }
        Write-Log "long-playback: FAIL — crash or ANR detected"
        exit 1
    }

    Start-Sleep -Seconds $intervalSeconds
    $elapsed += $intervalSeconds
    Write-Log "long-playback: elapsed ${elapsed}s / ${totalSeconds}s"
}

Write-Log "long-playback: PASS"
exit 0
