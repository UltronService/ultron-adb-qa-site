from pathlib import Path

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse

from models.automation import RunDetail, RunSummary
from services.run_storage_service import export_html, get_run, get_run_dir, list_runs

router = APIRouter(prefix="/api/runs", tags=["runs"])


@router.get("", response_model=list[RunSummary])
async def get_runs() -> list[RunSummary]:
    return list_runs()


@router.get("/{run_id}", response_model=RunDetail)
async def get_run_detail(run_id: str) -> RunDetail:
    detail = get_run(run_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Run not found.")
    return detail


@router.get("/{run_id}/export")
async def export_run(
    run_id: str,
    format: str = Query(default="html", alias="format"),
) -> HTMLResponse | JSONResponse:
    if format == "pdf":
        return JSONResponse(status_code=501, content={"detail": "PDF export not implemented"})

    if format != "html":
        raise HTTPException(status_code=400, detail="Supported formats: html, pdf.")

    html_content = export_html(run_id)
    if html_content is None:
        raise HTTPException(status_code=404, detail="Run not found.")

    return HTMLResponse(
        content=html_content,
        headers={"Content-Disposition": f'attachment; filename="{run_id}.html"'},
    )


@router.get("/{run_id}/artifacts/{artifact_path:path}")
async def get_run_artifact(run_id: str, artifact_path: str) -> FileResponse:
    run_dir = get_run_dir(run_id)
    if run_dir is None:
        raise HTTPException(status_code=404, detail="Run not found.")

    target = (run_dir / artifact_path).resolve()
    if not str(target).startswith(str(run_dir.resolve())):
        raise HTTPException(status_code=400, detail="Invalid artifact path.")

    if not target.is_file():
        raise HTTPException(status_code=404, detail="Artifact not found.")

    media_type = "image/png" if target.suffix == ".png" else "text/plain"
    return FileResponse(path=target, media_type=media_type, filename=target.name)
