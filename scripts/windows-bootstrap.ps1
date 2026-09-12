# Ultron ADB QA Site — Windows bootstrap (uses WSL Ubuntu)
# Run in PowerShell from repo root OR download and run after clone.
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\windows-bootstrap.ps1

$ErrorActionPreference = "Stop"

Write-Host "Ultron ADB QA Site — Windows bootstrap" -ForegroundColor Cyan

function Invoke-WslBash {
    param([string]$Command)
    wsl -d Ubuntu -- bash -lc $Command
    if ($LASTEXITCODE -ne 0) {
        throw "WSL command failed: $Command"
    }
}

try {
    Invoke-WslBash "echo ok" | Out-Null
}
catch {
    Write-Host "ERROR: WSL Ubuntu not available. Run: wsl --install -d Ubuntu" -ForegroundColor Red
    exit 1
}

$setupScript = @'
set -e
export PATH="$HOME/.local/bin:$PATH"

if ! command -v origin >/dev/null 2>&1; then
  echo "[1/5] Installing Origin CLI..."
  curl -fsSL https://downloads.cursor.com/origin/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
  grep -q '.local/bin' ~/.bashrc || echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
else
  echo "[1/5] Origin CLI OK"
fi

if [ ! -d "$HOME/ultron-adb-qa-site/frontend" ]; then
  echo "[2/5] Cloning repository..."
  if ! origin auth status >/dev/null 2>&1; then
    echo "Login required — complete browser auth, then run this script again."
    origin auth login
    exit 2
  fi
  origin repo clone admin-ultron/ultron-adb-qa-site
else
  echo "[2/5] Repository OK"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[3/5] Installing Node.js via nvm..."
  if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  fi
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm alias default 20
else
  echo "[3/5] Node.js OK"
fi

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

echo "[4/5] npm install..."
cd "$HOME/ultron-adb-qa-site/frontend"
npm install

echo "[5/5] Setup complete."
'@

Write-Host "Running WSL setup..." -ForegroundColor Yellow
wsl -d Ubuntu -- bash -lc $setupScript
if ($LASTEXITCODE -eq 2) {
    Write-Host "Complete origin auth login, then re-run this script." -ForegroundColor Yellow
    exit 2
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "Setup failed. See errors above." -ForegroundColor Red
    exit 1
}

Write-Host "Starting dev server in new WSL window..." -ForegroundColor Green
$devCommand = 'export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; cd ~/ultron-adb-qa-site/frontend && npm run dev -- --host 0.0.0.0 --port 5174'
Start-Process wt.exe -ArgumentList "wsl -d Ubuntu -- bash -lc `"$devCommand`"" -ErrorAction SilentlyContinue
if ($LASTEXITCODE -ne 0) {
    Start-Process wsl -ArgumentList "-d Ubuntu", "--", "bash", "-lc", $devCommand
}

Start-Sleep -Seconds 4
Write-Host "Opening Chrome at http://127.0.0.1:5174" -ForegroundColor Green
Start-Process "http://127.0.0.1:5174"

Write-Host "Done. Keep the WSL dev server window open." -ForegroundColor Cyan
