# Route B — Get the repo on Windows via WSL + Origin CLI

Use this path when PowerShell `git clone` to `origin.cursor.com` fails with Git Credential Manager.

- **Browse URL**: https://cursor.com/codebase/admin-ultron/ultron-adb-qa-site
- **Visibility**: Private (change in Settings on that page)
- **Origin CLI docs**: https://cursor.com/docs/origin/cli

## Prerequisites (Windows)

1. [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) (Ubuntu recommended)
2. [Node.js LTS](https://nodejs.org/) on Windows (for Chrome preview) or in WSL
3. Google Chrome on Windows

## Step 1 — Install Origin CLI in WSL

Open **Ubuntu** (WSL) and run:

```bash
# Run in WSL (Origin CLI is not available in PowerShell)
# Install the Origin CLI
curl -fsSL https://downloads.cursor.com/origin/install.sh | sh

# Sign in (also sets up git credentials)
origin auth login

# Clone the repository
origin repo clone admin-ultron/ultron-adb-qa-site
```

If `origin` is not found after install:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## Step 2 — Start frontend in WSL

```bash
cd ultron-adb-qa-site/frontend
npm install
npm run dev
```

Open in **Windows Chrome**: http://127.0.0.1:43123

## Step 3 — Start agent (optional, second WSL tab)

```bash
cd ~/ultron-adb-qa-site/agent
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8765
```

Health check: http://127.0.0.1:8765/health

## Step 4 — Open project in Cursor (optional)

1. Install [Cursor](https://cursor.com) on Windows
2. **File → Open Folder**
3. Browse to WSL path, e.g. `\\wsl$\Ubuntu\home\<user>\ultron-adb-qa-site`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `origin: command not found` | Add `~/.local/bin` to PATH (see above) |
| Chrome cannot open localhost | Ensure `npm run dev` is running in WSL |
| `npm: command not found` in WSL | `sudo apt update && sudo apt install -y nodejs npm` |
