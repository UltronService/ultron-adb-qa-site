import html
import json
from pathlib import Path
from typing import Any

from models.automation import RunDetail, RunSummary, RunSummaryCounts, StoredDeviceResult

_RUNS_ROOT = Path(__file__).resolve().parent.parent / "data" / "runs"

TEMPLATE_NAMES: dict[str, str] = {
    "cold-start": "Cold start time",
    "monkey": "Monkey stress",
    "long-play": "Long playback",
    "reboot-net": "Reboot network restore",
}


def sanitize_serial(serial: str) -> str:
    return serial.replace(":", "_").replace("/", "_")


def get_runs_root() -> Path:
    _RUNS_ROOT.mkdir(parents=True, exist_ok=True)
    return _RUNS_ROOT


def create_run_dir(run_id: str) -> Path:
    run_dir = get_runs_root() / run_id
    (run_dir / "logs").mkdir(parents=True, exist_ok=True)
    (run_dir / "screenshots").mkdir(parents=True, exist_ok=True)
    return run_dir


def save_meta(run_dir: Path, meta: dict[str, Any]) -> None:
    meta_path = run_dir / "meta.json"
    meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")


def _load_meta_file(meta_path: Path) -> dict[str, Any] | None:
    if not meta_path.is_file():
        return None
    try:
        return json.loads(meta_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def list_runs() -> list[RunSummary]:
    root = get_runs_root()
    summaries: list[RunSummary] = []

    for run_dir in root.iterdir():
        if not run_dir.is_dir():
            continue
        meta = _load_meta_file(run_dir / "meta.json")
        if meta is None:
            continue

        summary = meta.get("summary", {})
        summaries.append(
            RunSummary(
                id=meta["id"],
                started_at=meta["started_at"],
                finished_at=meta["finished_at"],
                template_id=meta["template_id"],
                template_name=meta["template_name"],
                pass_count=summary.get("pass", 0),
                fail=summary.get("fail", 0),
                device_count=len(meta.get("devices", [])),
            )
        )

    summaries.sort(key=lambda item: item.started_at, reverse=True)
    return summaries


def get_run(run_id: str) -> RunDetail | None:
    meta_path = get_runs_root() / run_id / "meta.json"
    meta = _load_meta_file(meta_path)
    if meta is None:
        return None

    summary = meta.get("summary", {})
    devices = [StoredDeviceResult.model_validate(device) for device in meta.get("devices", [])]

    return RunDetail(
        id=meta["id"],
        template_id=meta["template_id"],
        template_name=meta["template_name"],
        started_at=meta["started_at"],
        finished_at=meta["finished_at"],
        params=meta.get("params", {}),
        summary=RunSummaryCounts(pass_count=summary.get("pass", 0), fail=summary.get("fail", 0)),
        devices=devices,
    )


def get_run_dir(run_id: str) -> Path | None:
    run_dir = get_runs_root() / run_id
    if not run_dir.is_dir():
        return None
    return run_dir


def export_html(run_id: str) -> str | None:
    detail = get_run(run_id)
    if detail is None:
        return None

    run_dir = get_run_dir(run_id)
    if run_dir is None:
        return None

    device_sections: list[str] = []
    for device in detail.devices:
        steps_html = "".join(
            f"<li><strong>{html.escape(step.name)}</strong>: "
            f"{html.escape(step.status.value)}"
            f"{f' — {html.escape(step.detail)}' if step.detail else ''}</li>"
            for step in device.steps
        )
        log_excerpt = ""
        if device.log_path:
            log_file = run_dir / device.log_path
            if log_file.is_file():
                content = log_file.read_text(encoding="utf-8", errors="replace")
                excerpt = content[-4000:] if len(content) > 4000 else content
                log_excerpt = f"<pre>{html.escape(excerpt)}</pre>"

        device_sections.append(
            f"<section><h2>{html.escape(device.device_label)} ({html.escape(device.device_id)})</h2>"
            f"<p>Status: <strong>{html.escape(device.status)}</strong></p>"
            f"<ul>{steps_html}</ul>"
            f"{f'<p>Error: {html.escape(device.error)}</p>' if device.error else ''}"
            f"{log_excerpt}</section>"
        )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Ultron QA Report — {html.escape(detail.id)}</title>
  <style>
    body {{ font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.5; }}
    pre {{ background: #f4f4f4; padding: 1rem; overflow-x: auto; font-size: 0.85rem; }}
    section {{ margin-bottom: 2rem; border-bottom: 1px solid #ddd; padding-bottom: 1rem; }}
  </style>
</head>
<body>
  <h1>Ultron QA Test Report</h1>
  <p><strong>Run ID:</strong> {html.escape(detail.id)}</p>
  <p><strong>Template:</strong> {html.escape(detail.template_name)} ({html.escape(detail.template_id)})</p>
  <p><strong>Started:</strong> {html.escape(detail.started_at)}</p>
  <p><strong>Finished:</strong> {html.escape(detail.finished_at)}</p>
  <p><strong>Summary:</strong> Pass {detail.summary.pass_count}, Fail {detail.summary.fail}</p>
  {''.join(device_sections)}
</body>
</html>"""
