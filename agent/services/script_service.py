import asyncio
import json
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from models.schemas import (
    CreateScriptRequest,
    ScriptRunStatus,
    ScriptRunStepResult,
    ScriptStep,
    TestScript,
    UpdateScriptRequest,
)
from services.adb_service import AdbService

DEFAULT_SCRIPTS: list[TestScript] = [
    TestScript(
        id="preset-cold-start",
        name="Ultron 冷啟動",
        steps=[
            ScriptStep(
                id="s1",
                action="launch",
                label="開啟 Ultron Player",
                params={},
            ),
            ScriptStep(
                id="s2",
                action="wait",
                label="等待 5 秒",
                params={"seconds": "5"},
            ),
            ScriptStep(
                id="s3",
                action="screenshot",
                label="截圖：啟動後畫面",
                params={"name": "cold-start"},
            ),
        ],
        updated_at="",
    ),
    TestScript(
        id="preset-basic-nav",
        name="Ultron 基本導航",
        steps=[
            ScriptStep(
                id="s1",
                action="launch",
                label="開啟 Ultron Player",
                params={},
            ),
            ScriptStep(
                id="s2",
                action="wait",
                label="等待 3 秒",
                params={"seconds": "3"},
            ),
            ScriptStep(
                id="s3",
                action="key",
                label="按 OK",
                params={"key": "ok", "keycode": "23"},
            ),
            ScriptStep(
                id="s4",
                action="key",
                label="按 返回",
                params={"key": "back", "keycode": "4"},
            ),
            ScriptStep(
                id="s5",
                action="screenshot",
                label="截圖：導航後",
                params={"name": "after-nav"},
            ),
        ],
        updated_at="",
    ),
]


@dataclass
class ScriptRunJob:
    run_id: str
    script_id: str
    device_id: str
    script: TestScript
    state: str = "running"
    current_step: int = 0
    results: list[ScriptRunStepResult] = field(default_factory=list)
    stop_requested: bool = False


class ScriptService:
    def __init__(self, adb_service: AdbService) -> None:
        self._adb = adb_service
        self._storage_dir = Path(__file__).resolve().parent.parent / "storage" / "scripts"
        self._screenshot_dir = Path(__file__).resolve().parent.parent / "storage" / "screenshots"
        self._storage_dir.mkdir(parents=True, exist_ok=True)
        self._screenshot_dir.mkdir(parents=True, exist_ok=True)
        self._runs: dict[str, ScriptRunJob] = {}
        self._ensure_defaults()

    def _ensure_defaults(self) -> None:
        if any(self._storage_dir.glob("*.json")):
            return
        for script in DEFAULT_SCRIPTS:
            self._save_script(script)

    def _script_path(self, script_id: str) -> Path:
        return self._storage_dir / f"{script_id}.json"

    def _save_script(self, script: TestScript) -> TestScript:
        script.updated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
        self._script_path(script.id).write_text(
            script.model_dump_json(indent=2),
            encoding="utf-8",
        )
        return script

    def list_scripts(self) -> list[TestScript]:
        scripts: list[TestScript] = []
        for path in sorted(self._storage_dir.glob("*.json")):
            try:
                raw = json.loads(path.read_text(encoding="utf-8"))
                scripts.append(TestScript.model_validate(raw))
            except (json.JSONDecodeError, ValueError):
                continue
        scripts.sort(key=lambda item: item.updated_at, reverse=True)
        return scripts

    def get_script(self, script_id: str) -> TestScript:
        path = self._script_path(script_id)
        if not path.exists():
            raise KeyError("Script not found")
        raw = json.loads(path.read_text(encoding="utf-8"))
        return TestScript.model_validate(raw)

    def create_script(self, payload: CreateScriptRequest) -> TestScript:
        script = TestScript(
            id=str(uuid.uuid4()),
            name=payload.name.strip() or "新劇本",
            steps=[],
        )
        return self._save_script(script)

    def update_script(self, script_id: str, payload: UpdateScriptRequest) -> TestScript:
        existing = self.get_script(script_id)
        updated = TestScript(
            id=existing.id,
            name=payload.name.strip() or existing.name,
            target_package=payload.target_package,
            launch_activity=payload.launch_activity,
            steps=payload.steps,
        )
        return self._save_script(updated)

    def delete_script(self, script_id: str) -> None:
        path = self._script_path(script_id)
        if not path.exists():
            raise KeyError("Script not found")
        path.unlink()

    async def start_run(self, script_id: str, device_id: str) -> ScriptRunStatus:
        if not device_id.strip():
            raise ValueError("Device is required")

        script = self.get_script(script_id)
        if not script.steps:
            raise ValueError("Script has no steps")

        run_id = str(uuid.uuid4())
        job = ScriptRunJob(
            run_id=run_id,
            script_id=script_id,
            device_id=device_id,
            script=script,
            results=[
                ScriptRunStepResult(
                    step_index=index,
                    step_label=step.label,
                    status="pending",
                )
                for index, step in enumerate(script.steps)
            ],
        )
        self._runs[run_id] = job
        asyncio.create_task(self._execute_run(job))
        return self.get_run_status(run_id)

    def get_run_status(self, run_id: str) -> ScriptRunStatus:
        job = self._runs.get(run_id)
        if job is None:
            raise KeyError("Run not found")

        return ScriptRunStatus(
            run_id=job.run_id,
            script_id=job.script_id,
            device_id=job.device_id,
            state=job.state,
            current_step=job.current_step,
            results=list(job.results),
        )

    async def _execute_run(self, job: ScriptRunJob) -> None:
        for index, step in enumerate(job.script.steps):
            if job.stop_requested:
                job.state = "stopped"
                return

            job.current_step = index
            result = job.results[index]
            result.status = "running"

            try:
                message = await self._execute_step(job.device_id, step, job.script)
                result.status = "pass"
                result.message = message
            except RuntimeError as error:
                result.status = "fail"
                result.message = str(error)
                job.state = "failed"
                return
            except ValueError as error:
                result.status = "fail"
                result.message = str(error)
                job.state = "failed"
                return

        job.state = "completed"

    async def _execute_step(
        self,
        device_id: str,
        step: ScriptStep,
        script: TestScript,
    ) -> str:
        params = step.params
        action = step.action

        if action == "launch":
            component = params.get("component") or script.launch_activity
            if not self._adb.adb_available:
                await asyncio.sleep(0.5)
                return f"mock launch {component}"
            await self._adb.launch_activity(device_id, component)
            return f"已啟動 {component}"

        if action == "key":
            keycode = params.get("keycode", "23")
            if not self._adb.adb_available:
                await asyncio.sleep(0.3)
                return f"mock key {keycode}"
            await self._adb.send_key(device_id, keycode)
            return f"已送出按鍵 {params.get('key', keycode)}"

        if action == "wait":
            seconds = float(params.get("seconds", "1"))
            await asyncio.sleep(max(seconds, 0))
            return f"已等待 {seconds} 秒"

        if action == "text":
            text = params.get("text", "")
            if not text:
                raise ValueError("文字內容不可為空")
            if not self._adb.adb_available:
                await asyncio.sleep(0.3)
                return f"mock text {text}"
            await self._adb.send_text(device_id, text)
            return "已輸入文字"

        if action == "screenshot":
            name = params.get("name", "screenshot")
            if not self._adb.adb_available:
                await asyncio.sleep(0.3)
                return f"mock screenshot {name}"
            image_bytes = await self._adb.capture_screenshot(device_id)
            if not image_bytes:
                return f"mock screenshot {name}"
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
            safe_name = name.replace(" ", "-")
            file_path = self._screenshot_dir / f"{safe_name}-{timestamp}.png"
            file_path.write_bytes(image_bytes)
            return f"已截圖 {file_path.name}"

        if action == "logcat_export":
            if not self._adb.adb_available:
                await asyncio.sleep(0.5)
                return "mock log export"
            lines = await self._adb.dump_logcat(
                device_id,
                package_name=script.target_package,
            )
            return f"已匯出 {len(lines)} 行 log"

        raise ValueError(f"Unknown action: {action}")
