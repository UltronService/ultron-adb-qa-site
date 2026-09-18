# -*- coding: utf-8 -*-
import json, sqlite3, urllib.request, subprocess
from pathlib import Path

out = Path(r"D:\Cursor\ultron-adb-qa-site\sync\field-actuals.json")
api = json.load(urllib.request.urlopen("http://127.0.0.1:8765/api/devices"))

db = Path(r"D:\Cursor\ultron-adb-qa-site\sync\ultron_project_copy.db")
conn = sqlite3.connect(str(db))
conn.row_factory = sqlite3.Row
cur = conn.cursor()
tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY 1")]
samples = {}
for t in tables:
    try:
        cols = [r[1] for r in cur.execute(f"PRAGMA table_info({t})")]
        rows = [dict(r) for r in cur.execute(f"SELECT * FROM {t} LIMIT 5")]
        samples[t] = {"cols": cols, "rows": rows}
    except Exception as e:
        samples[t] = {"error": str(e)}

adb = r"C:\adb\platform-tools\adb.exe"
serial = "192.168.1.148:5555"
def sh(cmd):
    p = subprocess.run([adb, "-s", serial, "shell", cmd], capture_output=True, text=True, encoding="utf-8", errors="replace")
    return (p.stdout or "").strip()

props = {
  "brand": sh("getprop ro.product.brand"),
  "manufacturer": sh("getprop ro.product.manufacturer"),
  "model": sh("getprop ro.product.model"),
  "device": sh("getprop ro.product.device"),
  "android": sh("getprop ro.build.version.release"),
}
pkg = sh("dumpsys package com.ultron.player")
version_lines = [ln.strip() for ln in pkg.splitlines() if "versionName=" in ln or "versionCode=" in ln][:6]

result = {
  "qa_api_devices": api,
  "adb_props": props,
  "apk_version_lines": version_lines,
  "sqlite_tables": tables,
  "sqlite_samples": samples,
}
out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print("WROTE", out)
print("TABLES", tables)
