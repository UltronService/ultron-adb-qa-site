import asyncio
import re
import shutil
import subprocess
import sys
from collections.abc import AsyncIterator
from datetime import datetime, timezone

from models.schemas import DeviceInfo

LOG_LEVEL_MAP = {
    "Verbose": "V",
    "Debug": "D",
    "Info": "I",
    "Warn": "W",
    "Error": "E",
}


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
            ),
        ]

    @property
    def adb_available(self) -> bool:
        return shutil.which("adb") is not None

    async def _run_adb(self, *args: str) -> tuple[int, str, str]:
        return_code, stdout_bytes, stderr_bytes = await self._run_adb_bytes(*args)
        stdout = stdout_bytes.decode("utf-8", errors="replace")
        stderr = stderr_bytes.decode("utf-8", errors="replace")
        return return_code, stdout, stderr

    async def _run_adb_bytes(self, *args: str) -> tuple[int, bytes, bytes]:
        if not self.adb_available:
            return 1, b"", b"adb not found"

        if sys.platform == "win32":
            def _sync_run() -> tuple[int, bytes, bytes]:
                completed = subprocess.run(
                    ["adb", *args],
                    capture_output=True,
                )
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
        stdout_bytes, stderr_bytes = await process.communicate()
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

        return devices or list(self._mock_devices)

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

        return DeviceInfo(
            id=normalized,
            label=normalized,
            ip=normalized,
            online=True,
            model="Unknown",
            android_version="-",
        )

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

    @staticmethod
    def _extract_field(line: str, prefix: str) -> str:
        match = re.search(rf"{re.escape(prefix)}(\S+)", line)
        if not match:
            return ""
        return match.group(1).replace("_", " ")
