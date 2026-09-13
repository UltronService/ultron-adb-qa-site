from pydantic import BaseModel, Field


class DeviceInfo(BaseModel):
    id: str
    label: str
    ip: str
    online: bool
    model: str
    android_version: str
    cpu_percent: float = 0
    ram_percent: float = 0
    ping_ms: float = 0


class ConnectDeviceRequest(BaseModel):
    address: str = Field(..., description="IP:port, e.g. 192.168.1.101:5555")


class ApkInfo(BaseModel):
    id: str
    app_name: str
    package_name: str
    version_name: str
    version_code: int
    size_mb: float
    uploaded_at: str
    notes: str = ""
    launch_activity: str = ""


class InstallApkRequest(BaseModel):
    apk_id: str
    device_ids: list[str]


class AutomationTemplate(BaseModel):
    id: str
    name: str
    description: str


class RunAutomationRequest(BaseModel):
    template_id: str
    device_ids: list[str]
    params: dict[str, str] = Field(default_factory=dict)


class AutomationProgressRow(BaseModel):
    device_label: str
    step: str
    status: str


class AutomationRunStatus(BaseModel):
    run_id: str
    template_id: str
    state: str
    progress: list[AutomationProgressRow]


class ReportSummary(BaseModel):
    id: str
    date: str
    template: str
    pass_count: int
    fail_count: int


class ReportDiff(BaseModel):
    report_id: str
    baseline_label: str
    candidate_label: str
    diff_score: float
