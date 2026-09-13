from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class TemplateId(str, Enum):
    COLD_START = "cold-start"
    MONKEY = "monkey"
    LONG_PLAY = "long-play"
    REBOOT_NET = "reboot-net"


class RunStatus(str, Enum):
    COMPLETED = "completed"
    FAILED = "failed"


class DeviceStatus(str, Enum):
    PASS = "pass"
    FAIL = "fail"


class StepStatus(str, Enum):
    PASS = "pass"
    FAIL = "fail"


class AutomationParams(BaseModel):
    package_name: str | None = None
    monkey_events: int = Field(default=500, ge=1, le=100_000)
    duration_minutes: int = Field(default=30, ge=1, le=720)
    launch_time_max_ms: int = Field(default=3000, ge=100, le=60_000)


class RunRequest(BaseModel):
    template_id: TemplateId
    device_ids: list[str] = Field(..., min_length=1)
    params: AutomationParams = Field(default_factory=AutomationParams)


class RunStep(BaseModel):
    name: str
    status: StepStatus
    detail: str | None = None


class DeviceRunResult(BaseModel):
    device_id: str
    device_label: str
    status: DeviceStatus
    steps: list[RunStep]
    error: str | None = None


class RunSummaryCounts(BaseModel):
    pass_count: int = Field(alias="pass")
    fail: int

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class RunAutomationResponse(BaseModel):
    run_id: str
    status: RunStatus
    summary: RunSummaryCounts
    devices: list[DeviceRunResult]


class RunSummary(BaseModel):
    id: str
    started_at: str
    finished_at: str
    template_id: str
    template_name: str
    pass_count: int = Field(alias="pass")
    fail: int
    device_count: int

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


class StoredDeviceResult(BaseModel):
    device_id: str
    device_label: str
    status: str
    steps: list[RunStep]
    log_path: str | None = None
    screenshot_path: str | None = None
    error: str | None = None


class RunDetail(BaseModel):
    id: str
    template_id: str
    template_name: str
    started_at: str
    finished_at: str
    params: dict[str, Any]
    summary: RunSummaryCounts
    devices: list[StoredDeviceResult]
