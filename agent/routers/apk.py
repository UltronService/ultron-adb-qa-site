from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from models.schemas import ApkInfo, InstallApkRequest
from services.adb_service import AdbService
from services.apk_service import ApkService

router = APIRouter(prefix="/api/apk", tags=["apk"])
apk_service = ApkService(AdbService())


@router.get("", response_model=list[ApkInfo])
async def list_apks() -> list[ApkInfo]:
    return apk_service.list_apks()


@router.post("/upload", response_model=ApkInfo)
async def upload_apk(
    file: UploadFile = File(...),
    notes: str = Form(default=""),
) -> ApkInfo:
    try:
        return await apk_service.upload_apk(file, notes)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/install")
async def install_apk(payload: InstallApkRequest) -> dict[str, str]:
    try:
        return await apk_service.install_apk(payload.apk_id, payload.device_ids)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
