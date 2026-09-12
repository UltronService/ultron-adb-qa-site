#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${1:-$HOME/ultron-adb-qa-site}"

cd "$REPO_DIR"

echo "==> Remotes"
git remote -v

echo "==> Pull latest from Origin (if available)"
git pull origin main || echo "Origin pull skipped or failed — continuing"

echo "==> Ensure GitHub Pages basename fix exists"
if ! grep -q 'routerBasename' frontend/src/app.tsx 2>/dev/null; then
  echo "WARNING: frontend/src/app.tsx missing basename fix."
  echo "         Get latest code from Cursor cloud agent before pushing."
fi

echo "==> Push to GitHub"
git push github main

echo "==> Done. Check Actions: https://github.com/UltronService/ultron-adb-qa-site/actions"
