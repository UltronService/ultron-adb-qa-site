import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import UploadFile

from models.schemas import ApkInfo
from services.adb_service import AdbService


class ApkService:
    def __init__(self, adb_service: AdbService) -> None:
        self._adb = adb_service
        self._storage_dir = Path(__file__).resolve().parent.parent / "storage" / "apks"
        self._meta_file = self._storage_dir / "index.json"
        self._storage_dir.mkdir(parents=True, exist_ok=True)
        if not self._meta_file.exists():
            self._meta_file.write_text("[]", encoding="utf-8")

    def list_apks(self) -> list[ApkInfo]:
        try:
            raw = json.loads(self._meta_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return []

        return [ApkInfo.model_validate(item) for item in raw]

    async def upload_apk(self, upload: UploadFile, notes: str = "") -> ApkInfo:
        if not upload.filename or not upload.filename.endswith(".apk"):
            raise ValueError("Only .apk files are supported")

        apk_id = str(uuid.uuid4())
        target_path = self._storage_dir / f"{apk_id}.apk"
        content = await upload.read()
        target_path.write_bytes(content)

        size_mb = round(len(content) / (1024 * 1024), 2)
        package_name = upload.filename.replace(".apk", "")
        record = ApkInfo(
            id=apk_id,
            app_name=package_name,
            package_name=package_name,
            version_name="unknown",
            version_code=0,
            size_mb=size_mb,
            uploaded_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
            notes=notes,
        )

        records = self.list_apks()
        records.insert(0, record)
        self._meta_file.write_text(
            json.dumps([item.model_dump() for item in records], indent=2),
            encoding="utf-8",
        )
        return record

    async def install_apk(self, apk_id: str, device_ids: list[str]) -> dict[str, str]:
        if not device_ids:
            raise ValueError("At least one device is required")

        apk_path = self._storage_dir / f"{apk_id}.apk"
        if not apk_path.exists():
            raise FileNotFoundError("APK not found")

        results: dict[str, str] = {}
        for device_id in device_ids:
            try:
                await self._adb.install_apk(device_id, str(apk_path))
                results[device_id] = "installed"
            except RuntimeError as error:
                results[device_id] = f"failed: {error}"

        return results
