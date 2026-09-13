import base64
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from services.adb_service import AdbService

router = APIRouter(prefix="/api/console", tags=["console"])
adb_service = AdbService()
LOG_STORAGE_DIR = Path(__file__).resolve().parent.parent / "storage" / "logs"


class KeyEventRequest(BaseModel):
    keycode: str


class TextInputRequest(BaseModel):
    text: str


class LogcatExportRequest(BaseModel):
    package_name: str = Field(default="com.ultron.player")
    log_level: str = Field(default="Info")
    max_lines: int = Field(default=2000, ge=100, le=10000)


@router.post("/{device_id}/screenshot")
async def capture_screenshot(device_id: str) -> dict[str, str]:
    try:
        image_bytes = await adb_service.capture_screenshot(device_id)
        if not image_bytes:
            return {"image_base64": "", "mock": "true"}

        encoded = base64.b64encode(image_bytes).decode("ascii")
        return {"image_base64": encoded, "mock": "false"}
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/{device_id}/key")
async def send_key(device_id: str, payload: KeyEventRequest) -> dict[str, str]:
    try:
        await adb_service.send_key(device_id, payload.keycode)
        return {"status": "ok"}
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/{device_id}/text")
async def send_text(device_id: str, payload: TextInputRequest) -> dict[str, str]:
    try:
        await adb_service.send_text(device_id, payload.text)
        return {"status": "ok"}
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/{device_id}/logcat/export")
async def export_logcat(device_id: str, payload: LogcatExportRequest) -> dict[str, str | int]:
    try:
        lines = await adb_service.dump_logcat(
            device_id,
            package_name=payload.package_name,
            log_level=payload.log_level,
            max_lines=payload.max_lines,
        )
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    LOG_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    safe_device = device_id.replace(":", "-")
    filename = f"logcat-{safe_device}-{timestamp}.log"
    file_path = LOG_STORAGE_DIR / filename
    content = "\n".join(lines)
    file_path.write_text(content, encoding="utf-8")

    return {
        "filename": filename,
        "line_count": len(lines),
        "content": content,
        "mock": "false" if adb_service.adb_available else "true",
    }


@router.websocket("/{device_id}/logcat")
async def stream_logcat(
    websocket: WebSocket,
    device_id: str,
    package: str = "com.ultron.player",
    level: str = "Info",
) -> None:
    await websocket.accept()
    try:
        async for line in adb_service.stream_logcat(
            device_id,
            package_name=package,
            log_level=level,
        ):
            await websocket.send_text(line)
    except WebSocketDisconnect:
        return
    except RuntimeError as error:
        await websocket.send_text(f"[Error] Logcat stream failed: {error}")
        await websocket.close()
