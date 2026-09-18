# Ultron ADB QA Site

Internal web console for testing APK builds on multiple Android set-top boxes via ADB.

## Project Structure

```text
.
├── agent/          # FastAPI local agent (ADB, APK, automation)
├── docs/           # Project context and specs
└── frontend/       # Vite + React + TypeScript SPA
```

## Office one-click (Windows)

```powershell
cd D:\Cursor\ultron-adb-qa-site
.\scripts\office-update-and-start.ps1
```

Pulls branch `cursor/console-apk-zh-tw-c5d8` then opens **http://127.0.0.1:43123/console** (繁中主控台：APK 安裝/卸載、清除資料、錄影、時間設定、截圖、Logcat)。

## Prerequisites

- Node.js 18+
- Python 3.11+
- `adb` installed on the machine that runs the agent (office test host)

## Run Frontend (development)

From the repository root:

**bash (macOS/Linux):**

```bash
cd frontend
npm install
npm run dev
```

**Windows PowerShell 5.x** (does not support `&&`):

```powershell
cd frontend
npm install
npm run dev
```

Dev server: `http://127.0.0.1:43123`

Build for production:

```bash
npm run build
npm run preview
```

For GitHub Pages, set `VITE_BASE_PATH` to your repository path before building.

## Run Agent (development)

**bash (macOS/Linux):**

```bash
cd agent
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8765
```

**Windows PowerShell:**

```powershell
cd agent
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8765
```

Health check: `http://127.0.0.1:8765/health`

## GitHub Pages

- **Repository**: https://github.com/UltronService/ultron-adb-qa-site
- **Live URL** (after first deploy): https://ultronservice.github.io/ultron-adb-qa-site/
- **Setup**: see [docs/github-pages-setup.md](./docs/github-pages-setup.md)

Push to `main` triggers GitHub Actions deploy.

## Deployment Notes

- Frontend: GitHub Pages (UI only)
- Agent: office test host with ADB access to STBs
- Tunnel: Cloudflare Tunnel (or similar) to connect HTTPS frontend to the agent
