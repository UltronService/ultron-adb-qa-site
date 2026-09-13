import asyncio
import re
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ApkMetadata:
    app_name: str
    package_name: str
    version_name: str
    version_code: int
    launch_activity: str


ULTRON_PLAYER_DEFAULTS = ApkMetadata(
    app_name="Ultron Player",
    package_name="com.ultron.player",
    version_name="v1.0.0(10042)",
    version_code=10042,
    launch_activity="com.ultron.player/.MainActivity",
)


def _find_aapt_binary() -> str | None:
    direct = shutil.which("aapt")
    if direct:
        return direct

    android_home = Path.home() / "Android" / "Sdk"
    if android_home.is_dir():
        candidates = sorted(android_home.glob("build-tools/*/aapt"), reverse=True)
        if candidates:
            return str(candidates[0])

    return None


def _parse_aapt_output(raw: str) -> ApkMetadata | None:
    package_match = re.search(
        r"package: name='([^']+)' versionCode='(\d+)' versionName='([^']*)'",
        raw,
    )
    if not package_match:
        return None

    label_match = re.search(r"application-label(?:-\w+)?:'([^']+)'", raw)
    activity_match = re.search(r"launchable-activity: name='([^']+)'", raw)

    package_name = package_match.group(1)
    version_code = int(package_match.group(2))
    version_name = package_match.group(3) or "unknown"
    app_name = label_match.group(1) if label_match else package_name
    launch_activity = f"{package_name}/.MainActivity"
    if activity_match:
        activity_full = activity_match.group(1)
        if activity_full.startswith(f"{package_name}."):
            relative = activity_full[len(package_name) :]
            launch_activity = f"{package_name}/{relative}"
        elif activity_full.startswith(package_name):
            launch_activity = activity_full.replace(".", "/", 1)
        else:
            launch_activity = f"{package_name}/{activity_full.split('.')[-1]}"

    return ApkMetadata(
        app_name=app_name,
        package_name=package_name,
        version_name=version_name,
        version_code=version_code,
        launch_activity=launch_activity,
    )


def _parse_aapt_badging(apk_path: Path) -> ApkMetadata | None:
    aapt = _find_aapt_binary()
    if not aapt:
        return None

    try:
        completed = subprocess.run(
            [aapt, "dump", "badging", str(apk_path)],
            capture_output=True,
            text=True,
            check=False,
            timeout=30,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None

    if completed.returncode != 0:
        return None

    return _parse_aapt_output(completed.stdout)


def _infer_ultron_defaults(filename: str) -> ApkMetadata | None:
    normalized = filename.lower()
    if "ultron" not in normalized and "com.ultron.player" not in normalized:
        return None
    return ULTRON_PLAYER_DEFAULTS


def _fallback_from_filename(filename: str) -> ApkMetadata:
    stem = filename.replace(".apk", "")
    return ApkMetadata(
        app_name=stem,
        package_name=stem,
        version_name="unknown",
        version_code=0,
        launch_activity="",
    )


def extract_apk_metadata_sync(apk_path: Path, filename: str) -> ApkMetadata:
    parsed = _parse_aapt_badging(apk_path)
    if parsed:
        return parsed

    inferred = _infer_ultron_defaults(filename)
    if inferred:
        return inferred

    return _fallback_from_filename(filename)


async def extract_apk_metadata(apk_path: Path, filename: str) -> ApkMetadata:
    return await asyncio.to_thread(extract_apk_metadata_sync, apk_path, filename)
