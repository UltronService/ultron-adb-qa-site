import asyncio
import re
import shutil
import subprocess
import sys
from collections.abc import AsyncIterator
from dataclasses import asdict, dataclass
from datetime import datetime, timezone

from models.schemas import DeviceInfo

ULTRON_PLAYER_PACKAGE = "com.ultron.player"
ULTRON_DB_PATH = "databases/ultron_project"
ULTRON_LOGIN_SQL = (
    "SELECT brandName, branchName, categoryName, deviceId, lastGetScheduleDate "
    "FROM login LIMIT 1;"
)
ADB_SHELL_TIMEOUT_SEC = 8.0

LOG_LEVEL_MAP = {
    "Verbose": "V",
    "Debug": "D",
    "Info": "I",
    "Warn": "W",
    "Error": "E",
}


@dataclass(frozen=True)
class UltronPlayerProfile:
    brand_name: str = ""
    branch_name: str = ""
    player_device_id: int | None = None
    category_name: str = ""
    installed_apk_version: str = ""
    last_schedule_sync_at: str = ""


class AdbService:
    """ADB command wrappers with mock fallback when adb is unavailable."""

    def __init__(self) -> None:
        self._mock_devices: list[DeviceInfo] = [
            DeviceInfo(
                id="stb-176",
                label="Hi3751V560",
                ip="192.168.1.176:5555",
                online=True,
                model="Hi3751V560",
                android_version="11",
                cpu_percent=23,
                ram_percent=61,
                ping_ms=4,
                brand_name="Demo Brand",
                branch_name="Demo Store 176",
                player_device_id=1001,
                category_name="大螢幕",
                installed_apk_version="v1.0.0(10053)",
                last_schedule_sync_at="2026-09-14",
            ),
            DeviceInfo(
                id="stb-148",
                label="gk6760v100",
                ip="192.168.1.148:5555",
                online=True,
                model="gk6760v100",
                android_version="9",
                cpu_percent=41,
                ram_percent=72,
                ping_ms=6,
                brand_name="Demo Brand",
                branch_name="Demo Store 148",
                player_device_id=1002,
                category_name="櫃台",
                installed_apk_version="v1.0.0(10053)",
                last_schedule_sync_at="2026-09-14",
            ),
        ]

    @property
    def adb_available(self) -> bool:
        return shutil.which("adb") is not None

    async def _run_adb(
        self,
        *args: str,
        timeout_sec: float | None = None,
    ) -> tuple[int, str, str]:
        return_code, stdout_bytes, stderr_bytes = await self._run_adb_bytes(
            *args,
            timeout_sec=timeout_sec,
        )
        stdout = stdout_bytes.decode("utf-8", errors="replace")
        stderr = stderr_bytes.decode("utf-8", errors="replace")
        return return_code, stdout, stderr

    async def _run_adb_bytes(
        self,
        *args: str,
        timeout_sec: float | None = None,
    ) -> tuple[int, bytes, bytes]:
        if not self.adb_available:
            return 1, b"", b"adb not found"

        if sys.platform == "win32":
            def _sync_run() -> tuple[int, bytes, bytes]:
                try:
                    completed = subprocess.run(
                        ["adb", *args],
                        capture_output=True,
                        timeout=timeout_sec,
                    )
                except subprocess.TimeoutExpired:
                    return 124, b"", b"adb command timed out"

                return (
                    completed.returncode or 0,
                    completed.stdout or b"",
                    completed.stderr or b"",
                )

            return await asyncio.to_thread(_sync_run)

        process = await asyncio.create_subprocess_exec(
            "adb",
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            if timeout_sec is None:
                stdout_bytes, stderr_bytes = await process.communicate()
            else:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    process.communicate(),
                    timeout=timeout_sec,
                )
        except asyncio.TimeoutError:
            if process.returncode is None:
                process.kill()
                await process.wait()
            return 124, b"", b"adb command timed out"

        return process.returncode or 0, stdout_bytes, stderr_bytes

    async def list_devices(self) -> list[DeviceInfo]:
        if not self.adb_available:
            return list(self._mock_devices)

        try:
            return_code, stdout, _stderr = await self._run_adb("devices", "-l")
        except (OSError, NotImplementedError) as error:
            return list(self._mock_devices)

        if return_code != 0:
            return list(self._mock_devices)

        devices: list[DeviceInfo] = []
        for line in stdout.splitlines()[1:]:
            if not line.strip():
                continue
            parts = line.split()
            if len(parts) < 2:
                continue
            serial, state = parts[0], parts[1]
            online = state == "device"
            model = self._extract_field(line, "model:")
            device = DeviceInfo(
                id=serial,
                label=serial,
                ip=serial if ":" in serial else f"{serial}:5555",
                online=online,
                model=model or "Unknown",
                android_version="-",
            )
            devices.append(device)

        if devices:
            devices = await asyncio.gather(*[self._enrich_device(device) for device in devices])
            return list(devices)

        return list(self._mock_devices)

    async def connect(self, address: str) -> DeviceInfo:
        normalized = address.strip()
        if not normalized:
            raise ValueError("Address is required")

        if not self.adb_available:
            device = DeviceInfo(
                id=f"mock-{normalized}",
                label=f"Mock-{normalized}",
                ip=normalized,
                online=True,
                model="Mock STB",
                android_version="11",
            )
            self._mock_devices.append(device)
            return device

        return_code, _stdout, stderr = await self._run_adb("connect", normalized)
        if return_code != 0:
            raise RuntimeError(stderr or "Failed to connect device")

        devices = await self.list_devices()
        for device in devices:
            if device.ip == normalized or device.id == normalized:
                return device

        fallback = DeviceInfo(
            id=normalized,
            label=normalized,
            ip=normalized,
            online=True,
            model="Unknown",
            android_version="-",
        )
        return await self._enrich_device(fallback)

    async def scan_lan(self) -> list[DeviceInfo]:
        if not self.adb_available:
            return list(self._mock_devices)

        # MVP: refresh adb devices list as scan result
        return await self.list_devices()

    async def capture_screenshot(self, device_id: str) -> bytes:
        if not self.adb_available:
            return b""

        return_code, stdout_bytes, stderr_bytes = await self._run_adb_bytes(
            "-s",
            device_id,
            "exec-out",
            "screencap",
            "-p",
        )
        if return_code != 0:
            stderr = stderr_bytes.decode("utf-8", errors="replace")
            raise RuntimeError(stderr or "Screenshot failed")

        return stdout_bytes

    async def send_key(self, device_id: str, keycode: str) -> None:
        if not self.adb_available:
            return

        return_code, _stdout, stderr = await self._run_adb(
            "-s",
            device_id,
            "shell",
            "input",
            "keyevent",
            keycode,
        )
        if return_code != 0:
            raise RuntimeError(stderr or "Key event failed")

    async def send_text(self, device_id: str, text: str) -> None:
        if not self.adb_available:
            return

        escaped = text.replace(" ", "%s")
        return_code, _stdout, stderr = await self._run_adb(
            "-s",
            device_id,
            "shell",
            "input",
            "text",
            escaped,
        )
        if return_code != 0:
            raise RuntimeError(stderr or "Text input failed")

    async def install_apk(self, device_id: str, apk_path: str) -> None:
        if not self.adb_available:
            return

        return_code, _stdout, stderr = await self._run_adb(
            "-s",
            device_id,
            "install",
            "-r",
            apk_path,
        )
        if return_code != 0:
            raise RuntimeError(stderr or "APK install failed")

    async def resolve_package_pid(self, device_id: str, package_name: str) -> str | None:
        if not self.adb_available or not package_name:
            return None

        return_code, stdout, _stderr = await self._run_adb(
            "-s",
            device_id,
            "shell",
            "pidof",
            "-s",
            package_name,
        )
        if return_code != 0:
            return None

        pid = stdout.strip()
        return pid if pid else None

    @staticmethod
    def format_logcat_line(line: str) -> str:
        for marker, label in (
            (" E ", "Error"),
            (" W ", "Warn"),
            (" I ", "Info"),
            (" D ", "Debug"),
            (" V ", "Verbose"),
        ):
            if marker in line:
                return f"[{label}] {line}"
        return f"[Info] {line}"

    async def stream_logcat(
        self,
        device_id: str,
        package_name: str = "",
        log_level: str = "Info",
    ) -> AsyncIterator[str]:
        if not self.adb_available:
            mock_lines = [
                f"[Info] Mock logcat for {device_id} — adb not available on this host",
                "[Info] App launch: com.ultron.player/.MainActivity",
                "[Debug] Player buffer ready",
                "[Warn] Network latency spike: 280ms",
                "[Error] Sample error line for filter testing",
            ]
            index = 0
            while True:
                yield mock_lines[index % len(mock_lines)]
                index += 1
                await asyncio.sleep(2)

        pid = await self.resolve_package_pid(device_id, package_name) if package_name else None
        level_flag = LOG_LEVEL_MAP.get(log_level, "I")
        args: list[str] = ["-s", device_id, "logcat", "-v", "threadtime"]
        if pid:
            args.extend(["--pid", pid])
        else:
            args.append(f"*:{level_flag}")

        process = await asyncio.create_subprocess_exec(
            "adb",
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        if process.stdout is None:
            raise RuntimeError("Failed to start logcat stream")

        try:
            while True:
                line_bytes = await process.stdout.readline()
                if not line_bytes:
                    break
                line = line_bytes.decode("utf-8", errors="replace").rstrip()
                if not line:
                    continue
                yield self.format_logcat_line(line)
        finally:
            if process.returncode is None:
                process.kill()
                await process.wait()

    async def dump_logcat(
        self,
        device_id: str,
        package_name: str = "",
        log_level: str = "Info",
        max_lines: int = 2000,
    ) -> list[str]:
        if not self.adb_available:
            return [
                f"[Info] Mock log export for {device_id}",
                "[Info] com.ultron.player/.MainActivity",
                "[Warn] adb not available — connect office Agent for real logs",
            ]

        pid = await self.resolve_package_pid(device_id, package_name) if package_name else None
        level_flag = LOG_LEVEL_MAP.get(log_level, "I")
        args: list[str] = ["-s", device_id, "logcat", "-d", "-v", "threadtime"]
        if pid:
            args.extend(["--pid", pid])
        else:
            args.append(f"*:{level_flag}")

        return_code, stdout, stderr = await self._run_adb(*args)
        if return_code != 0:
            raise RuntimeError(stderr or "Logcat dump failed")

        lines = [
            self.format_logcat_line(line)
            for line in stdout.splitlines()
            if line.strip()
        ]
        return lines[-max_lines:]

    async def launch_activity(self, device_id: str, component: str) -> None:
        if not self.adb_available:
            return

        return_code, _stdout, stderr = await self._run_adb(
            "-s",
            device_id,
            "shell",
            "am",
            "start",
            "-n",
            component,
        )
        if return_code != 0:
            raise RuntimeError(stderr or "Activity launch failed")

    async def _enrich_device(self, device: DeviceInfo) -> DeviceInfo:
        if not device.online or not self.adb_available:
            return device

        try:
            profile = await self._fetch_ultron_player_profile(device.id)
        except (OSError, NotImplementedError, RuntimeError):
            return device

        return device.model_copy(update=asdict(profile))

    async def _fetch_ultron_player_profile(self, device_id: str) -> UltronPlayerProfile:
        login_task = self._fetch_ultron_login_row(device_id)
        apk_task = self._fetch_installed_apk_version(device_id)
        login_row, installed_apk_version = await asyncio.gather(login_task, apk_task)

        if login_row is None:
            return UltronPlayerProfile(installed_apk_version=installed_apk_version)

        brand_name, branch_name, category_name, player_device_id, last_schedule_sync_at = login_row
        return UltronPlayerProfile(
            brand_name=brand_name,
            branch_name=branch_name,
            player_device_id=player_device_id,
            category_name=category_name,
            installed_apk_version=installed_apk_version,
            last_schedule_sync_at=last_schedule_sync_at,
        )

    async def _fetch_ultron_login_row(
        self,
        device_id: str,
    ) -> tuple[str, str, str, int | None, str] | None:
        # Single adb shell string keeps the SQL quoted on the STB (Windows-safe).
        shell_command = (
            f"run-as {ULTRON_PLAYER_PACKAGE} sqlite3 {ULTRON_DB_PATH} "
            f"\"{ULTRON_LOGIN_SQL.strip()}\""
        )
        try:
            return_code, stdout, _stderr = await self._run_adb(
                "-s",
                device_id,
                "shell",
                shell_command,
                timeout_sec=ADB_SHELL_TIMEOUT_SEC,
            )
        except (OSError, NotImplementedError):
            return None

        if return_code != 0:
            return None

        line = stdout.strip().splitlines()[0] if stdout.strip() else ""
        if not line:
            return None

        parts = line.split("|")
        if len(parts) < 5:
            return None

        brand_name = parts[0].strip()
        branch_name = parts[1].strip()
        category_name = parts[2].strip()
        player_device_id = self._parse_optional_int(parts[3])
        last_schedule_sync_at = parts[4].strip()
        return brand_name, branch_name, category_name, player_device_id, last_schedule_sync_at

    async def _fetch_installed_apk_version(self, device_id: str) -> str:
        try:
            return_code, stdout, _stderr = await self._run_adb(
                "-s",
                device_id,
                "shell",
                "dumpsys",
                "package",
                ULTRON_PLAYER_PACKAGE,
                timeout_sec=ADB_SHELL_TIMEOUT_SEC,
            )
        except (OSError, NotImplementedError):
            return ""

        if return_code != 0:
            return ""

        for line in stdout.splitlines():
            stripped = line.strip()
            if stripped.startswith("versionName="):
                return stripped.split("=", 1)[1].strip()

        return ""

    @staticmethod
    def _parse_optional_int(raw: str) -> int | None:
        normalized = raw.strip()
        if not normalized or normalized.lower() == "null":
            return None
        try:
            return int(normalized)
        except ValueError:
            return None

    @staticmethod
    def _extract_field(line: str, prefix: str) -> str:
        match = re.search(rf"{re.escape(prefix)}(\S+)", line)
        if not match:
            return ""
        return match.group(1).replace("_", " ")
