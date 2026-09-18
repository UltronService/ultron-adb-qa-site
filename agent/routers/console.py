import base64
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
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


class ShellCommandRequest(BaseModel):
    command: str = Field(..., min_length=1, max_length=500)


class ForceStopRequest(BaseModel):
    package_name: str = Field(..., min_length=1)


class LaunchAppRequest(BaseModel):
    package_name: str = Field(default="com.ultron.player")
    activity: str = Field(default="com.ultron.player/.MainActivity")


class PackageNameRequest(BaseModel):
    package_name: str = Field(default="com.ultron.player")


class ScreenRecordRequest(BaseModel):
    duration_seconds: int = Field(default=30, ge=1, le=180)


class SetDateTimeRequest(BaseModel):
    datetime: str = Field(..., min_length=1)


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


@router.post("/{device_id}/shell")
async def run_shell(device_id: str, payload: ShellCommandRequest) -> dict[str, str]:
    try:
        output = await adb_service.run_shell(device_id, payload.command)
        return {"output": output, "mock": "false" if adb_service.adb_available else "true"}
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/{device_id}/reboot")
async def reboot_device(device_id: str) -> dict[str, str]:
    try:
        await adb_service.reboot_device(device_id)
        return {"status": "ok", "mock": "false" if adb_service.adb_available else "true"}
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/{device_id}/force-stop")
async def force_stop_app(device_id: str, payload: ForceStopRequest) -> dict[str, str]:
    try:
        await adb_service.force_stop_app(device_id, payload.package_name)
        return {"status": "ok", "mock": "false" if adb_service.adb_available else "true"}
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/{device_id}/launch-app")
async def launch_app(device_id: str, payload: LaunchAppRequest) -> dict[str, str]:
    try:
        await adb_service.launch_app(
            device_id,
            payload.package_name,
            payload.activity,
        )
        return {"status": "ok", "mock": "false" if adb_service.adb_available else "true"}
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/{device_id}/clear-app")
async def clear_app_data(device_id: str, payload: PackageNameRequest) -> dict[str, str]:
    try:
        await adb_service.clear_app_data(device_id, payload.package_name)
        return {"status": "ok", "mock": "false" if adb_service.adb_available else "true"}
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/{device_id}/uninstall")
async def uninstall_app(device_id: str, payload: PackageNameRequest) -> dict[str, str]:
    try:
        await adb_service.uninstall_app(device_id, payload.package_name)
        return {"status": "ok", "mock": "false" if adb_service.adb_available else "true"}
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/{device_id}/install")
async def install_app_on_device(
    device_id: str,
    replace: bool = Form(default=True),
    allow_downgrade: bool = Form(default=False),
    apk_file: UploadFile = File(...),
) -> dict[str, str]:
    if not apk_file.filename or not apk_file.filename.lower().endswith(".apk"):
        raise HTTPException(status_code=400, detail="An .apk file is required.")

    suffix = Path(apk_file.filename).suffix or ".apk"
    temp_path: Path | None = None

    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
            temp_path = Path(temp_file.name)
            content = await apk_file.read()
            temp_path.write_bytes(content)

        await adb_service.install_apk(
            device_id,
            str(temp_path),
            replace=replace,
            allow_downgrade=allow_downgrade,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)

    return {"status": "ok", "mock": "false" if adb_service.adb_available else "true"}


@router.post("/{device_id}/screenrecord")
async def capture_screen_record(device_id: str, payload: ScreenRecordRequest) -> Response:
    try:
        video_bytes = await adb_service.capture_screen_record(
            device_id,
            payload.duration_seconds,
        )
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error

    if not video_bytes:
        raise HTTPException(status_code=503, detail="Screen recording unavailable (adb not found)")

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    safe_device = device_id.replace(":", "-")
    filename = f"screenrecord-{safe_device}-{timestamp}.mp4"
    return Response(
        content=video_bytes,
        media_type="video/mp4",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{device_id}/datetime/set")
async def set_device_datetime(device_id: str, payload: SetDateTimeRequest) -> dict[str, str]:
    try:
        message = await adb_service.set_device_datetime(device_id, payload.datetime)
        return {
            "status": "ok",
            "message": message,
            "mock": "false" if adb_service.adb_available else "true",
        }
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/{device_id}/datetime/restore-network")
async def restore_network_time(device_id: str) -> dict[str, str]:
    try:
        message = await adb_service.restore_network_time(device_id)
        return {
            "status": "ok",
            "message": message,
            "mock": "false" if adb_service.adb_available else "true",
        }
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.get("/{device_id}/props")
async def get_device_props(device_id: str) -> dict[str, str | dict[str, str]]:
    try:
        props = await adb_service.get_device_props(device_id)
        return {
            "props": props,
            "mock": "false" if adb_service.adb_available else "true",
        }
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


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
