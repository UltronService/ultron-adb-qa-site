# GitHub Pages Setup

## Live URL

After deployment:

https://ultronservice.github.io/ultron-adb-qa-site/

Repository: https://github.com/UltronService/ultron-adb-qa-site

## Prerequisites

**Private repos cannot use GitHub Pages on the free plan.** Choose one:

| Option | Cost | Notes |
|--------|------|-------|
| **A. Make repo Public** (recommended) | Free | Fine for UI mock; no secrets in repo |
| B. Upgrade GitHub | Paid | Keeps repo private |
| C. Cloudflare Pages / Vercel | Free | Works with private repo; different URL |

This guide assumes **Option A**.

## One-time GitHub settings

1. Open https://github.com/UltronService/ultron-adb-qa-site/settings
2. Scroll to **Danger Zone** → **Change repository visibility** → **Public**
3. Open https://github.com/UltronService/ultron-adb-qa-site/settings/pages
4. Under **Build and deployment** → **Source**, select **GitHub Actions**
5. Save if prompted

## Deploy workflow

Pushing to `main` runs `.github/workflows/deploy-github-pages.yml`:

- Builds `frontend/` with `VITE_BASE_PATH=/ultron-adb-qa-site/`
- Copies `index.html` to `404.html` for SPA routing
- Publishes to GitHub Pages

## Sync code from local (WSL)

```bash
cd ~/ultron-adb-qa-site
git pull
git push github main
```

## Local dev vs Pages

| Environment | URL |
|-------------|-----|
| Local dev | http://127.0.0.1:5174 |
| GitHub Pages | https://ultronservice.github.io/ultron-adb-qa-site/ |

Local dev uses base `/`. Pages build uses base `/ultron-adb-qa-site/`.

## Agent API + Cloudflare Tunnel

GitHub Pages 只放 UI。ADB 操作需辦公室 Agent + Cloudflare Tunnel。

1. 依 [Cloudflare Tunnel 設定指南](./cloudflare-tunnel-setup.md) 啟動 tunnel
2. 在 GitHub repo **Settings → Secrets → Actions** 新增 `VITE_AGENT_URL`（tunnel 的 https URL）
3. 重新 Run **Deploy GitHub Pages** workflow
