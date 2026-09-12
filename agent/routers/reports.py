from fastapi import APIRouter, HTTPException

from models.schemas import ReportDiff, ReportSummary
from services.reports_service import ReportsService

router = APIRouter(prefix="/api/reports", tags=["reports"])
reports_service = ReportsService()


@router.get("", response_model=list[ReportSummary])
async def list_reports() -> list[ReportSummary]:
    return reports_service.list_reports()


@router.get("/{report_id}", response_model=ReportSummary)
async def get_report(report_id: str) -> ReportSummary:
    try:
        return reports_service.get_report(report_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/{report_id}/diff", response_model=ReportDiff)
async def get_report_diff(report_id: str) -> ReportDiff:
    try:
        return reports_service.get_diff(report_id)
    except KeyError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
