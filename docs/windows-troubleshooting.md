# Windows Troubleshooting

## Wrong terminal (PowerShell vs WSL)

The repository lives inside **WSL Ubuntu** at `~/ultron-adb-qa-site`, not in `C:\Users\User\`.

| Terminal | Use for |
|----------|---------|
| **Ubuntu (WSL)** | `origin`, `npm`, `git` for this project |
| **PowerShell** | Run `.\scripts\windows-bootstrap.ps1` only |

Do **not** run `cd ~/ultron-adb-qa-site` in PowerShell — `~` maps to `C:\Users\User` there.

## Nested WSL namespace (`systemd` message)

If you see:

```text
You will be automatically entered into a nested process namespace where systemd is running
```

You may be in a sub-shell where the repo and `apt` are unavailable.

**Fix:** Exit twice (`exit` or Ctrl+D) until you are back in PowerShell, then run:

```powershell
wsl -d Ubuntu -- bash -lc "ls ~/ultron-adb-qa-site"
```

Or use the bootstrap script (recommended):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows-bootstrap.ps1
```

## `apt: command not found`

Your current shell may not be full Ubuntu. Use:

```powershell
wsl -d Ubuntu
```

The bootstrap script installs Node via **nvm** when `apt` is unavailable.

## `localhost` connection refused

1. Ensure dev server is still running (WSL window open).
2. Use `http://127.0.0.1:5174` (port may differ from 43123).
3. Start with host binding:

```bash
npm run dev -- --host 0.0.0.0 --port 5174
```

4. Try WSL IP from `hostname -I` in a second WSL tab.

## Repository missing after clone

Re-clone inside WSL:

```bash
export PATH="$HOME/.local/bin:$PATH"
origin auth login
origin repo clone admin-ultron/ultron-adb-qa-site
```
