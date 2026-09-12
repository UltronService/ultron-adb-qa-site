from fastapi import APIRouter, HTTPException

from models.schemas import AutomationRunStatus, AutomationTemplate, RunAutomationRequest
from services.automation_service import AutomationService

router = APIRouter(prefix="/api/automation", tags=["automation"])
automation_service = AutomationService()


@router.get("/templates", response_model=list[AutomationTemplate])
async def list_templates() -> list[AutomationTemplate]:
    return automation_service.list_templates()


@router.post("/run", response_model=AutomationRunStatus)
async def run_automation(payload: RunAutomationRequest) -> AutomationRunStatus:
    try:
        return await automation_service.start_run(
            payload.template_id,
            payload.device_ids,
            payload.params,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/runs/{run_id}", response_model=AutomationRunStatus)
async def get_run_status(run_id: str) -> AutomationRunStatus:
    try:
        return automation_service.get_status(run_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
