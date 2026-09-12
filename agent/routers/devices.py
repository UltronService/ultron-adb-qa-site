from fastapi import APIRouter, HTTPException

from models.schemas import ConnectDeviceRequest, DeviceInfo
from services.adb_service import AdbService

router = APIRouter(prefix="/api/devices", tags=["devices"])
adb_service = AdbService()


@router.get("", response_model=list[DeviceInfo])
async def get_devices() -> list[DeviceInfo]:
    try:
        return await adb_service.list_devices()
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/connect", response_model=DeviceInfo)
async def connect_device(payload: ConnectDeviceRequest) -> DeviceInfo:
    try:
        return await adb_service.connect(payload.address)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.post("/scan", response_model=list[DeviceInfo])
async def scan_devices() -> list[DeviceInfo]:
    try:
        return await adb_service.scan_lan()
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
