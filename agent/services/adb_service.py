import asyncio
import re
import shutil
from typing import Any

from models.schemas import DeviceInfo


class AdbService:
    """ADB command wrappers with mock fallback when adb is unavailable."""

    def __init__(self) -> None:
        self._mock_devices: list[DeviceInfo] = [
            DeviceInfo(
                id="stb-1",
                label="STB-LivingRoom",
                ip="192.168.1.101:5555",
                online=True,
                model="X96 Max+",
                android_version="11",
                cpu_percent=23,
                ram_percent=61,
                ping_ms=4,
            ),
            DeviceInfo(
                id="stb-2",
                label="STB-QA-Bench",
                ip="192.168.1.102:5555",
                online=True,
                model="Tanix TX3",
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

        return_code, stdout, _stderr = await self._run_adb("devices", "-l")
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

    @staticmethod
    def _extract_field(line: str, prefix: str) -> str:
        match = re.search(rf"{re.escape(prefix)}(\S+)", line)
        if not match:
            return ""
        return match.group(1).replace("_", " ")
