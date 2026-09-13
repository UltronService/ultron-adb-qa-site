from fastapi import APIRouter, HTTPException

from models.schemas import (
    CreateScriptRequest,
    RunScriptRequest,
    ScriptRunStatus,
    TestScript,
    UpdateScriptRequest,
)
from services.adb_service import AdbService
from services.script_service import ScriptService

router = APIRouter(prefix="/api/scripts", tags=["scripts"])
script_service = ScriptService(AdbService())


@router.get("", response_model=list[TestScript])
async def list_scripts() -> list[TestScript]:
    return script_service.list_scripts()


@router.post("", response_model=TestScript)
async def create_script(payload: CreateScriptRequest) -> TestScript:
    return script_service.create_script(payload)


@router.get("/runs/{run_id}", response_model=ScriptRunStatus)
async def get_run_status(run_id: str) -> ScriptRunStatus:
    try:
        return script_service.get_run_status(run_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/{script_id}", response_model=TestScript)
async def get_script(script_id: str) -> TestScript:
    try:
        return script_service.get_script(script_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.put("/{script_id}", response_model=TestScript)
async def update_script(script_id: str, payload: UpdateScriptRequest) -> TestScript:
    try:
        return script_service.update_script(script_id, payload)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.delete("/{script_id}")
async def delete_script(script_id: str) -> dict[str, str]:
    try:
        script_service.delete_script(script_id)
        return {"status": "deleted"}
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/{script_id}/run", response_model=ScriptRunStatus)
async def run_script(script_id: str, payload: RunScriptRequest) -> ScriptRunStatus:
    try:
        return await script_service.start_run(script_id, payload.device_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
