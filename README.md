# Ultron ADB QA Site

Internal web console for testing APK builds on multiple Android set-top boxes via ADB.

## Project Structure

```text
.
├── agent/          # FastAPI local agent (ADB, APK, automation)
├── docs/           # Project context and specs
└── frontend/       # Vite + React + TypeScript SPA
```

## Prerequisites

- Node.js 18+
- Python 3.11+
- `adb` installed on the machine that runs the agent (office test host)

## Run Frontend (development)

```bash
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

```bash
cd agent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8765
```

Health check: `http://127.0.0.1:8765/health`

## Deployment Notes

- Frontend: GitHub Pages
- Agent: office test host with ADB access to STBs
- Tunnel: Cloudflare Tunnel (or similar) to connect HTTPS frontend to the agent

Office host deployment steps will be documented in a later phase.
