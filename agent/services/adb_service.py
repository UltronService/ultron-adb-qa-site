import asyncio
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from collections.abc import AsyncIterator
from dataclasses import asdict, dataclass
from datetime import datetime, timezone

from models.schemas import (
    DeviceInfo,
    MediaScheduleItem,
    ProjectScheduleItem,
    ScheduleMediaResponse,
    TodaySchedule,
)

ULTRON_PLAYER_PACKAGE = "com.ultron.player"
ULTRON_DB_PATH = "databases/ultron_project"
ULTRON_LOGIN_SQL = (
    "SELECT brandName, branchName, categoryName, deviceId, lastGetScheduleDate "
    "FROM login LIMIT 1;"
)
ULTRON_PROJECTS_SQL = (
    "SELECT id, layoutId, startDate, endDate, startTime, endTime, dayOfWeeks, isInterrupt "
    "FROM project;"
)
ULTRON_MEDIA_SQL = (
    "SELECT id, name, type, duration, startDate, endDate, param FROM media;"
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
class HardwareGetpropProfile:
    product_brand: str = ""
    product_manufacturer: str = ""
    product_model: str = ""
    setup_box: str = ""


@dataclass(frozen=True)
class UltronPlayerProfile:
    brand_name: str = ""
    branch_name: str = ""
    player_device_id: int | None = None
    category_name: str = ""
    installed_apk_version: str = ""
    last_schedule_sync_at: str = ""
    version_code: str = ""


@dataclass(frozen=True)
class InstalledApkInfo:
    version_name: str = ""
    version_code: str = ""


class AdbService:
    """ADB command wrappers with mock fallback when adb is unavailable."""

    def __init__(self) -> None:
        self._cached_public_ip: str | None = None
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
                product_brand="AOC",
                product_manufacturer="TAISHAN",
                product_model="Hi3751V560",
                brand_name="奧創傳媒",
                branch_name="台北信義店",
                player_device_id=1001,
                category_name="大螢幕",
                installed_apk_version="v1.0.0(10053)",
                last_schedule_sync_at="2026-09-14",
                setup_box="SPX432-01-UM",
                public_ip="1.164.183.8",
                version_code="10053",
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
                product_brand="AOC",
                product_manufacturer="TAISHAN",
                product_model="taishan",
                brand_name="奧創傳媒",
                branch_name="多專案排程",
                player_device_id=101,
                category_name="櫃台",
                installed_apk_version="v1.0.0(10054)",
                last_schedule_sync_at="2026-09-14",
                setup_box="SPX432-03-UM",
                public_ip="1.164.183.8",
                version_code="10054",
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

    async def fetch_schedule_media(self, device_id: str) -> ScheduleMediaResponse:
        normalized_id = device_id.strip()
        if not normalized_id:
            raise ValueError("Device id is required")

        if not self.adb_available:
            return self._mock_schedule_media(normalized_id)

        try:
            projects, media, today_schedule = await asyncio.gather(
                self._fetch_ultron_projects(normalized_id),
                self._fetch_ultron_media(normalized_id),
                self._fetch_ultron_today_schedule(normalized_id),
            )
        except (OSError, NotImplementedError, RuntimeError) as error:
            raise RuntimeError(f"無法讀取排程資料：{error}") from error

        if not projects and not media:
            mock_match = next(
                (
                    device
                    for device in self._mock_devices
                    if device.id == normalized_id or device.ip == normalized_id
                ),
                None,
            )
            if mock_match is not None:
                return self._mock_schedule_media(mock_match.id)

            raise RuntimeError(
                "找不到 Ultron Player 排程資料庫，請確認裝置已安裝並登入 Player"
            )

        return ScheduleMediaResponse(
            device_id=normalized_id,
            projects=projects,
            media=media,
            today_schedule=today_schedule,
            mock=False,
        )

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
            ultron_profile, hardware_profile, public_ip = await asyncio.gather(
                self._fetch_ultron_player_profile(device.id),
                self._fetch_hardware_getprop(device.id),
                self._fetch_public_ip(),
            )
        except (OSError, NotImplementedError, RuntimeError):
            return device

        return device.model_copy(
            update={
                **asdict(ultron_profile),
                **asdict(hardware_profile),
                "public_ip": public_ip,
            },
        )

    async def _fetch_hardware_getprop(self, device_id: str) -> HardwareGetpropProfile:
        props = (
            ("product_brand", "ro.product.brand"),
            ("product_manufacturer", "ro.product.manufacturer"),
            ("product_model", "ro.product.model"),
        )
        getprop_tasks = [self._fetch_getprop_value(device_id, prop_key) for _, prop_key in props]
        setup_box_task = self._fetch_setup_box(device_id)
        values = await asyncio.gather(*getprop_tasks, setup_box_task)
        return HardwareGetpropProfile(
            product_brand=values[0],
            product_manufacturer=values[1],
            product_model=values[2],
            setup_box=values[3],
        )

    async def _fetch_setup_box(self, device_id: str) -> str:
        try:
            return_code, stdout, _stderr = await self._run_adb(
                "-s",
                device_id,
                "shell",
                "settings",
                "get",
                "global",
                "device_name",
                timeout_sec=ADB_SHELL_TIMEOUT_SEC,
            )
        except (OSError, NotImplementedError):
            return ""

        if return_code != 0:
            return ""

        value = stdout.strip()
        if not value or value.lower() == "null":
            return ""

        return value

    async def _fetch_public_ip(self) -> str:
        if self._cached_public_ip is not None:
            return self._cached_public_ip

        def _sync_fetch() -> str:
            try:
                with urllib.request.urlopen("https://api.ipify.org", timeout=5) as response:
                    return response.read().decode("utf-8").strip()
            except (OSError, urllib.error.URLError, TimeoutError):
                return ""

        public_ip = await asyncio.to_thread(_sync_fetch)
        self._cached_public_ip = public_ip
        return public_ip

    async def _fetch_getprop_value(self, device_id: str, prop_key: str) -> str:
        try:
            return_code, stdout, _stderr = await self._run_adb(
                "-s",
                device_id,
                "shell",
                "getprop",
                prop_key,
                timeout_sec=ADB_SHELL_TIMEOUT_SEC,
            )
        except (OSError, NotImplementedError):
            return ""

        if return_code != 0:
            return ""

        return stdout.strip()

    async def _fetch_ultron_player_profile(self, device_id: str) -> UltronPlayerProfile:
        login_task = self._fetch_ultron_login_row(device_id)
        apk_task = self._fetch_installed_apk_info(device_id)
        login_row, apk_info = await asyncio.gather(login_task, apk_task)

        if login_row is None:
            return UltronPlayerProfile(
                installed_apk_version=apk_info.version_name,
                version_code=apk_info.version_code,
            )

        brand_name, branch_name, category_name, player_device_id, last_schedule_sync_at = login_row
        return UltronPlayerProfile(
            brand_name=brand_name,
            branch_name=branch_name,
            player_device_id=player_device_id,
            category_name=category_name,
            installed_apk_version=apk_info.version_name,
            last_schedule_sync_at=last_schedule_sync_at,
            version_code=apk_info.version_code,
        )

    async def _run_ultron_sql(self, device_id: str, sql: str) -> list[list[str]]:
        shell_command = (
            f"run-as {ULTRON_PLAYER_PACKAGE} sqlite3 {ULTRON_DB_PATH} "
            f"\"{sql.strip()}\""
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
            return []

        if return_code != 0:
            return []

        rows: list[list[str]] = []
        for line in stdout.strip().splitlines():
            if not line.strip():
                continue
            rows.append(line.split("|"))
        return rows

    async def _fetch_ultron_projects(self, device_id: str) -> list[ProjectScheduleItem]:
        rows = await self._run_ultron_sql(device_id, ULTRON_PROJECTS_SQL)
        projects: list[ProjectScheduleItem] = []
        for parts in rows:
            if len(parts) < 8:
                continue
            projects.append(
                ProjectScheduleItem(
                    id=self._parse_optional_int(parts[0]) or 0,
                    layout_id=self._parse_optional_int(parts[1]),
                    start_date=parts[2].strip(),
                    end_date=parts[3].strip(),
                    start_time=parts[4].strip(),
                    end_time=parts[5].strip(),
                    day_of_weeks=parts[6].strip(),
                    is_interrupt=self._parse_bool(parts[7]),
                ),
            )
        return projects

    async def _fetch_ultron_media(self, device_id: str) -> list[MediaScheduleItem]:
        rows = await self._run_ultron_sql(device_id, ULTRON_MEDIA_SQL)
        media_items: list[MediaScheduleItem] = []
        for parts in rows:
            if len(parts) < 7:
                continue
            media_items.append(
                MediaScheduleItem(
                    id=self._parse_optional_int(parts[0]) or 0,
                    name=parts[1].strip(),
                    type=parts[2].strip(),
                    duration_sec=self._parse_optional_int(parts[3]) or 0,
                    start_date=parts[4].strip(),
                    end_date=parts[5].strip(),
                    file_name=parts[6].strip(),
                ),
            )
        return media_items

    async def _fetch_ultron_today_schedule(self, device_id: str) -> TodaySchedule | None:
        today = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d")
        sql = f"SELECT date, projectIds FROM schedule WHERE date = '{today}' LIMIT 1;"
        rows = await self._run_ultron_sql(device_id, sql)
        if not rows or len(rows[0]) < 2:
            return None

        date_value = rows[0][0].strip()
        project_ids = self._parse_id_list(rows[0][1])
        return TodaySchedule(date=date_value, project_ids=project_ids)

    def _mock_schedule_media(self, device_id: str) -> ScheduleMediaResponse:
        mock_device = next(
            (device for device in self._mock_devices if device.id == device_id),
            None,
        )
        label = mock_device.branch_name if mock_device else "展示裝置"

        projects = [
            ProjectScheduleItem(
                id=1,
                layout_id=10,
                start_date="2026-01-01",
                end_date="2026-12-31",
                start_time="08:00:00",
                end_time="22:00:00",
                day_of_weeks="1,2,3,4,5,6,7",
                is_interrupt=False,
            ),
            ProjectScheduleItem(
                id=2,
                layout_id=11,
                start_date="2026-09-01",
                end_date="2026-09-30",
                start_time="12:00:00",
                end_time="13:00:00",
                day_of_weeks="1,2,3,4,5",
                is_interrupt=True,
            ),
        ]
        media_items = [
            MediaScheduleItem(
                id=101,
                name=f"{label} 開場影片",
                type="video",
                duration_sec=15,
                start_date="2026-01-01",
                end_date="2026-12-31",
                file_name="intro_2026.mp4",
            ),
            MediaScheduleItem(
                id=102,
                name="午間促銷圖",
                type="image",
                duration_sec=10,
                start_date="2026-09-01",
                end_date="2026-09-30",
                file_name="lunch_promo.jpg",
            ),
            MediaScheduleItem(
                id=103,
                name="天氣資訊",
                type="web",
                duration_sec=30,
                start_date="2026-01-01",
                end_date="2026-12-31",
                file_name="https://weather.example.com/widget",
            ),
        ]
        today = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d")
        return ScheduleMediaResponse(
            device_id=device_id,
            projects=projects,
            media=media_items,
            today_schedule=TodaySchedule(date=today, project_ids=[1, 2]),
            mock=True,
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

    async def _fetch_installed_apk_info(self, device_id: str) -> InstalledApkInfo:
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
            return InstalledApkInfo()

        if return_code != 0:
            return InstalledApkInfo()

        version_name = ""
        version_code = ""
        for line in stdout.splitlines():
            stripped = line.strip()
            if stripped.startswith("versionName="):
                version_name = stripped.split("=", 1)[1].strip()
            elif stripped.startswith("versionCode="):
                version_code = stripped.split("=", 1)[1].split()[0].strip()

        return InstalledApkInfo(version_name=version_name, version_code=version_code)

    @staticmethod
    def _parse_bool(raw: str) -> bool:
        normalized = raw.strip().lower()
        return normalized in {"1", "true", "yes"}

    @staticmethod
    def _parse_id_list(raw: str) -> list[int]:
        normalized = raw.strip().strip("[]")
        if not normalized:
            return []

        ids: list[int] = []
        for token in normalized.split(","):
            value = token.strip().strip('"').strip("'")
            if not value:
                continue
            parsed = AdbService._parse_optional_int(value)
            if parsed is not None:
                ids.append(parsed)
        return ids

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
