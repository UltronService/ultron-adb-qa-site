import asyncio
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Final

from models.automation import (
    AutomationParams,
    DeviceStatus,
    RunStep,
    StepStatus,
    StoredDeviceResult,
    TemplateId,
)
from models.schemas import (
    AutomationProgressRow,
    AutomationRunStatus,
    AutomationTemplate,
)
from services.adb_errors import AdbCommandError, AdbNotFoundError
from services.adb_service import AdbService
from services.run_storage_service import (
    TEMPLATE_NAMES,
    create_run_dir,
    sanitize_serial,
    save_meta,
)

_SCRIPTS_DIR: Final[Path] = Path(__file__).resolve().parent.parent / "scripts"

_TEMPLATE_SCRIPT: Final[dict[TemplateId, str]] = {
    TemplateId.COLD_START: "cold-start.sh",
    TemplateId.MONKEY: "monkey-stress.sh",
    TemplateId.LONG_PLAY: "long-playback.sh",
    TemplateId.REBOOT_NET: "reboot-net.sh",
}

_LAUNCH_TIME_PATTERN: Final[re.Pattern[str]] = re.compile(r"launch_time_ms=(\d+)")


async def _run_subprocess_command(
    cmd: list[str],
    env: dict[str, str],
    cwd: str,
) -> tuple[int, str, str]:
    def _sync_run() -> tuple[int, str, str]:
        completed = subprocess.run(
            cmd,
            env=env,
            cwd=cwd,
            capture_output=True,
        )
        stdout = completed.stdout.decode(errors="replace") if completed.stdout else ""
        stderr = completed.stderr.decode(errors="replace") if completed.stderr else ""
        return completed.returncode, stdout, stderr

    return await asyncio.to_thread(_sync_run)


def _resolve_script_command(template_id: TemplateId) -> list[str]:
    script_name = _TEMPLATE_SCRIPT[template_id]
    script_stem = script_name.removesuffix(".sh")
    script_dir = _SCRIPTS_DIR

    if sys.platform == "win32":
        ps1_path = script_dir / f"{script_stem}.ps1"
        if ps1_path.is_file():
            return [
                "powershell",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(ps1_path),
            ]

    sh_path = script_dir / script_name
    return ["bash", str(sh_path)]


@dataclass
class AutomationJob:
    run_id: str
    template_id: str
    device_ids: list[str]
    params: dict[str, str]
    state: str = "running"
    progress: list[AutomationProgressRow] = field(default_factory=list)


class AutomationService:
    TEMPLATES: list[AutomationTemplate] = [
        AutomationTemplate(
            id="cold-start",
            name="Cold start time",
            description="Measure app launch to first frame.",
        ),
        AutomationTemplate(
            id="monkey",
            name="Monkey stress",
            description="Random UI stress with configurable taps.",
        ),
        AutomationTemplate(
            id="long-play",
            name="Long playback",
            description="Monitor playback stability over time.",
        ),
        AutomationTemplate(
            id="reboot-net",
            name="Reboot network restore",
            description="Reboot loop and verify network recovery.",
        ),
    ]

    def __init__(self) -> None:
        self._jobs: dict[str, AutomationJob] = {}
        self._adb = AdbService()

    def list_templates(self) -> list[AutomationTemplate]:
        return list(self.TEMPLATES)

    def _ensure_adb(self) -> None:
        if shutil.which("adb") is None:
            raise AdbNotFoundError("adb not found in PATH. Install Android Platform Tools.")

    def _parse_params(self, template_id: str, params: dict[str, str]) -> AutomationParams:
        template_enum = TemplateId(template_id)
        automation_params = AutomationParams(
            package_name=params.get("package_name") or None,
            launch_activity=params.get("launch_activity") or None,
            monkey_events=int(params.get("monkey_events", "500")),
            duration_minutes=int(params.get("duration_minutes", "30")),
            launch_time_max_ms=int(params.get("launch_time_max_ms", "5000")),
        )
        if template_enum != TemplateId.REBOOT_NET and not automation_params.package_name:
            raise ValueError("params.package_name is required for this template.")
        return automation_params

    async def start_run(
        self,
        template_id: str,
        device_ids: list[str],
        params: dict[str, str],
    ) -> AutomationRunStatus:
        if not device_ids:
            raise ValueError("At least one device is required")

        mock_ids = [device_id for device_id in device_ids if device_id.startswith("stb-")]
        if mock_ids:
            raise ValueError(
                f"Mock device ids cannot run automation: {', '.join(mock_ids)}. "
                "Refresh the devices page and use ADB serials like 192.168.1.176:5555."
            )

        template = next((item for item in self.TEMPLATES if item.id == template_id), None)
        if template is None:
            raise ValueError("Unknown template")

        automation_params = self._parse_params(template_id, params)
        self._ensure_adb()

        template_enum = TemplateId(template_id)
        run_id = self._generate_run_id(template_enum)
        job = AutomationJob(
            run_id=run_id,
            template_id=template_id,
            device_ids=device_ids,
            params=params,
            progress=[
                AutomationProgressRow(
                    device_label=device_id,
                    step="Queued",
                    status="Running",
                )
                for device_id in device_ids
            ],
        )
        self._jobs[run_id] = job
        asyncio.create_task(self._execute_run(job, template_enum, automation_params))
        return self.get_status(run_id)

    def get_status(self, run_id: str) -> AutomationRunStatus:
        job = self._jobs.get(run_id)
        if job is None:
            raise KeyError("Run not found")

        return AutomationRunStatus(
            run_id=job.run_id,
            template_id=job.template_id,
            state=job.state,
            progress=list(job.progress),
        )

    def _generate_run_id(self, template_id: TemplateId) -> str:
        timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
        return f"{timestamp}_{template_id.value}"

    async def _resolve_device_label(self, device_id: str) -> str:
        try:
            devices = await self._adb.list_devices()
        except (AdbCommandError, AdbNotFoundError, OSError):
            return device_id

        for device in devices:
            if device.id == device_id:
                return device.label
        return device_id

    async def _capture_screenshot(self, device_id: str, screenshot_path: Path) -> None:
        try:
            process = await asyncio.create_subprocess_exec(
                "adb",
                "-s",
                device_id,
                "exec-out",
                "screencap",
                "-p",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout_bytes, _ = await process.communicate()
            if process.returncode == 0 and stdout_bytes:
                screenshot_path.write_bytes(stdout_bytes)
        except OSError:
            return

    def _parse_steps_from_log(self, template_id: TemplateId, log_content: str, passed: bool) -> list[RunStep]:
        if template_id == TemplateId.COLD_START:
            match = _LAUNCH_TIME_PATTERN.search(log_content)
            detail = f"launch_time_ms={match.group(1)}" if match else None
            return [
                RunStep(name="force-stop", status=StepStatus.PASS if passed else StepStatus.FAIL),
                RunStep(
                    name="launch-app",
                    status=StepStatus.PASS if passed else StepStatus.FAIL,
                    detail=detail,
                ),
            ]

        if template_id == TemplateId.MONKEY:
            return [
                RunStep(name="clear-logcat", status=StepStatus.PASS if passed else StepStatus.FAIL),
                RunStep(name="monkey-stress", status=StepStatus.PASS if passed else StepStatus.FAIL),
                RunStep(name="check-fatal", status=StepStatus.PASS if passed else StepStatus.FAIL),
            ]

        if template_id == TemplateId.LONG_PLAY:
            return [
                RunStep(name="launch-app", status=StepStatus.PASS if passed else StepStatus.FAIL),
                RunStep(name="monitor-stability", status=StepStatus.PASS if passed else StepStatus.FAIL),
            ]

        return [
            RunStep(name="reboot", status=StepStatus.PASS if passed else StepStatus.FAIL),
            RunStep(name="wait-boot", status=StepStatus.PASS if passed else StepStatus.FAIL),
            RunStep(name="ping-network", status=StepStatus.PASS if passed else StepStatus.FAIL),
        ]

    def _latest_step_label(self, steps: list[RunStep], error: str | None) -> str:
        if not steps:
            return error or "Completed"
        last_step = steps[-1]
        if last_step.detail:
            return f"{last_step.name} ({last_step.detail})"
        return last_step.name

    async def _run_script_for_device(
        self,
        run_dir: Path,
        template_id: TemplateId,
        device_id: str,
        params: AutomationParams,
        progress_row: AutomationProgressRow,
    ) -> StoredDeviceResult:
        sanitized = sanitize_serial(device_id)
        log_path = run_dir / "logs" / f"{sanitized}.txt"
        screenshot_path = run_dir / "screenshots" / f"{sanitized}.png"

        try:
            device_label = await self._resolve_device_label(device_id)
        except Exception as error:
            device_label = device_id
            error_text = str(error) or error.__class__.__name__
            progress_row.device_label = device_label
            progress_row.step = error_text
            progress_row.status = "Fail"
            log_path.write_text(error_text, encoding="utf-8")
            return StoredDeviceResult(
                device_id=device_id,
                device_label=device_label,
                status=DeviceStatus.FAIL.value,
                steps=[],
                log_path=f"logs/{sanitized}.txt",
                error=error_text,
            )

        progress_row.device_label = device_label
        progress_row.step = "Running script"
        script_command = _resolve_script_command(template_id)

        env = os.environ.copy()
        env["ADB_SERIAL"] = device_id
        env["PACKAGE_NAME"] = params.package_name or ""
        package_name = params.package_name or "com.ultron.player"
        launch_activity = params.launch_activity or f"{package_name}/.MainActivity"
        env["LAUNCH_ACTIVITY"] = launch_activity
        env["MONKEY_EVENTS"] = str(params.monkey_events)
        env["DURATION_MINUTES"] = str(params.duration_minutes)
        env["LAUNCH_TIME_MAX_MS"] = str(params.launch_time_max_ms)
        env["RUN_LOG_PATH"] = str(log_path)

        error_message: str | None = None
        passed = False
        log_content = ""

        try:
            if sys.platform == "win32":
                return_code, stdout, stderr = await _run_subprocess_command(
                    script_command,
                    env,
                    str(_SCRIPTS_DIR),
                )
            else:
                process = await asyncio.create_subprocess_exec(
                    *script_command,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env=env,
                    cwd=str(_SCRIPTS_DIR),
                )
                stdout_bytes, stderr_bytes = await process.communicate()
                stdout = stdout_bytes.decode(errors="replace")
                stderr = stderr_bytes.decode(errors="replace")
                return_code = process.returncode or 0

            if log_path.is_file():
                log_content = log_path.read_text(encoding="utf-8", errors="replace")
            else:
                log_content = f"{stdout}\n{stderr}".strip()
                if log_content:
                    log_path.write_text(log_content, encoding="utf-8")

            passed = return_code == 0
            if not passed:
                error_message = stderr or stdout or f"Script exited with code {return_code}"
        except (OSError, NotImplementedError, RuntimeError) as error:
            error_message = str(error) or error.__class__.__name__
            log_path.write_text(error_message, encoding="utf-8")
            log_content = error_message
        else:
            if log_path.is_file():
                log_content = log_path.read_text(encoding="utf-8", errors="replace")

        await self._capture_screenshot(device_id, screenshot_path)
        screenshot_rel = f"screenshots/{sanitized}.png" if screenshot_path.is_file() else None

        steps = self._parse_steps_from_log(template_id, log_content, passed)
        status = DeviceStatus.PASS if passed else DeviceStatus.FAIL
        if passed:
            progress_row.step = self._latest_step_label(steps, error_message)
            progress_row.status = "Pass"
        else:
            progress_row.step = error_message or self._latest_step_label(steps, error_message) or "Script failed"
            progress_row.status = "Fail"

        return StoredDeviceResult(
            device_id=device_id,
            device_label=device_label,
            status=status.value,
            steps=steps,
            log_path=f"logs/{sanitized}.txt",
            screenshot_path=screenshot_rel,
            error=error_message,
        )

    async def _execute_run(
        self,
        job: AutomationJob,
        template_id: TemplateId,
        params: AutomationParams,
    ) -> None:
        started_at = datetime.now(UTC).isoformat().replace("+00:00", "Z")
        run_dir = create_run_dir(job.run_id)
        stored_results: list[StoredDeviceResult] = []

        if len(job.device_ids) != len(job.progress):
            mismatch_error = (
                f"Device/progress length mismatch: {len(job.device_ids)} vs {len(job.progress)}"
            )
            for row in job.progress:
                row.step = mismatch_error
                row.status = "Fail"
            job.state = "completed"
            self._save_run_meta(job, template_id, params, started_at, stored_results)
            return

        for device_id, progress_row in zip(job.device_ids, job.progress, strict=False):
            try:
                result = await self._run_script_for_device(
                    run_dir,
                    template_id,
                    device_id,
                    params,
                    progress_row,
                )
                stored_results.append(result)
            except Exception as error:
                error_text = str(error) or error.__class__.__name__
                progress_row.step = error_text
                progress_row.status = "Fail"
                sanitized = sanitize_serial(device_id)
                log_path = run_dir / "logs" / f"{sanitized}.txt"
                log_path.write_text(error_text, encoding="utf-8")
                stored_results.append(
                    StoredDeviceResult(
                        device_id=device_id,
                        device_label=progress_row.device_label or device_id,
                        status=DeviceStatus.FAIL.value,
                        steps=[],
                        log_path=f"logs/{sanitized}.txt",
                        error=error_text,
                    )
                )

        self._save_run_meta(job, template_id, params, started_at, stored_results)
        job.state = "completed"

    def _save_run_meta(
        self,
        job: AutomationJob,
        template_id: TemplateId,
        params: AutomationParams,
        started_at: str,
        stored_results: list[StoredDeviceResult],
    ) -> None:
        pass_count = sum(1 for result in stored_results if result.status == DeviceStatus.PASS.value)
        fail_count = len(stored_results) - pass_count
        finished_at = datetime.now(UTC).isoformat().replace("+00:00", "Z")
        run_dir = create_run_dir(job.run_id)
        meta = {
            "id": job.run_id,
            "template_id": template_id.value,
            "template_name": TEMPLATE_NAMES[template_id.value],
            "started_at": started_at,
            "finished_at": finished_at,
            "params": params.model_dump(exclude_none=True),
            "summary": {"pass": pass_count, "fail": fail_count},
            "devices": [result.model_dump(mode="json") for result in stored_results],
        }
        save_meta(run_dir, meta)
