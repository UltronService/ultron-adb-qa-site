# Ultron ADB QA Site — Project Context

## Product Summary

Ultron ADB QA Site is an internal web console for QA engineers to test APK builds on multiple Android set-top boxes (STBs) through ADB. A single operator uses the web UI to manage devices, install builds, run tests, and review results.

## Architecture

- **Frontend**: Static SPA hosted on GitHub Pages (HTTPS).
- **Local Agent**: Python FastAPI service on an office test host. Handles ADB commands, APK storage, automation, and image diff workloads.
- **Secure tunnel**: Cloudflare Tunnel (or equivalent) exposes the agent over HTTPS to avoid mixed-content issues from GitHub Pages.
- **Devices**: Android STBs on the office LAN, typically reachable on TCP port 5555.

## Operator Model

- Single-user operation. No multi-user device claim/lock workflow.
- Up to ~10 STBs may be connected for batch testing.

## Core Modules

1. **Device Dashboard** — device discovery, status, and metrics.
2. **Interactive Console** — remote control, screenshots, logcat, quick actions.
3. **APK Repository** — upload, version notes, batch install/uninstall.
4. **Test Automation** — scripted runs with live progress.
5. **Reports & Visual Diff** — history, exports, screenshot comparison.

## MVP Phases

### Phase 1

- Device list (manual IP + LAN scan)
- APK upload and batch install
- Basic remote control and screenshot capture
- Device status (online/offline, model, Android version)

### Phase 2

- Logcat WebSocket stream
- Richer console shortcuts

### Phase 3

- Automation templates and progress board — **implemented**: `POST /automation/run`, 4 shell scripts, Automation page wired to Agent
- Run history persistence — **implemented**: `agent/data/runs/`, `GET /runs`, Reports page wired to Agent
- HTML report export — **implemented**: `GET /runs/{id}/export?format=html`
- Test case docs — **implemented**: `docs/test-cases/` (TC-BOOT/STRESS/PLAY/NET)
- GitHub Issues templates — **implemented**: bug_report, test_failure
- Screenshot diff algorithm — not yet implemented (UI mock remains)

### Phase 4

- One-click test account login (depends on target app behavior)
