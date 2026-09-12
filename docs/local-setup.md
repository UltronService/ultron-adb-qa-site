# Local Setup Guide

Move development and ADB testing from Cursor Cloud to your office machine.

## 1. Get the code

### Option A — GitHub (recommended)

1. In Cursor Project, click **Create repo** if not done yet.
2. After the repo is linked to GitHub, clone on your machine:

```bash
git clone https://github.com/<your-org>/<your-repo>.git
cd <your-repo>
```

### Option B — Cursor Origin (current remote)

```bash
git clone https://origin.cursor.com/git/admin-ultron/tmp-3354235fd9a79908.git
cd tmp-3354235fd9a79908
```

You may need Cursor authentication for this URL.

## 2. Install prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Frontend dev server |
| Python | 3.11+ | FastAPI agent |
| Android Platform Tools | latest | `adb` for set-top boxes |

### macOS (Homebrew)

```bash
brew install node python android-platform-tools
```

### Windows

- Install [Node.js LTS](https://nodejs.org/)
- Install [Python 3.11+](https://www.python.org/downloads/)
- Install [Android SDK Platform Tools](https://developer.android.com/tools/releases/platform-tools) and add to PATH

### Linux (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install -y nodejs npm python3 python3-venv android-tools-adb
```

## 3. Run frontend

```bash
cd frontend
npm install
npm run dev
```

Open: http://127.0.0.1:43123

## 4. Run agent (ADB host)

```bash
cd agent
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8765
```

Health check: http://127.0.0.1:8765/health

## 5. Connect a set-top box (when ready)

Enable ADB over network on the STB (port 5555), then:

```bash
adb connect 192.168.1.x:5555
adb devices
```

The agent host must be on the same LAN as the STBs.

## 6. Open in Cursor locally

1. **File → Open Folder** → select the cloned repo
2. Continue UI work locally, or keep using Cloud Project for AI assistance
3. Sync changes with `git pull` / `git push`

## Cloud vs Local

| Task | Where |
|------|-------|
| Edit UI, review layout | Local or Cloud |
| ADB, install APK, LAN scan | Local agent host only |
| AI-assisted coding | Cloud Project or Local Agent |
