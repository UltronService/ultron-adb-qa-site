# GitHub Pages Setup

## Live URL

After deployment:

https://ultronservice.github.io/ultron-adb-qa-site/

Repository: https://github.com/UltronService/ultron-adb-qa-site

## One-time GitHub settings

1. Open https://github.com/UltronService/ultron-adb-qa-site/settings/pages
2. Under **Build and deployment** → **Source**, select **GitHub Actions**
3. Save if prompted

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

## Agent API (future)

GitHub Pages hosts UI only. ADB operations require the office Agent + Cloudflare Tunnel.
Set `VITE_AGENT_URL` in the workflow when the tunnel URL is ready.
