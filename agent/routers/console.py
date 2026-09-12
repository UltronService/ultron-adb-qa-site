import asyncio
import base64

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from services.adb_service import AdbService

router = APIRouter(prefix="/api/console", tags=["console"])
adb_service = AdbService()


class KeyEventRequest(BaseModel):
    keycode: str


class TextInputRequest(BaseModel):
    text: str


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


@router.websocket("/{device_id}/logcat")
async def stream_logcat(websocket: WebSocket, device_id: str) -> None:
    await websocket.accept()
    sample_lines = [
        f"[Info][{device_id}] App launch: com.example.tvapp/.MainActivity",
        f"[Debug][{device_id}] Player buffer ready",
        f"[Warn][{device_id}] Network latency spike: 280ms",
    ]
    try:
        index = 0
        while True:
            line = sample_lines[index % len(sample_lines)]
            await websocket.send_text(line)
            index += 1
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        return
