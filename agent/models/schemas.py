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
    product_brand: str = ""
    product_manufacturer: str = ""
    product_model: str = ""
    brand_name: str = ""
    branch_name: str = ""
    player_device_id: int | None = None
    category_name: str = ""
    installed_apk_version: str = ""
    last_schedule_sync_at: str = ""
    setup_box: str = ""
    public_ip: str = ""
    version_code: str = ""


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


class ScriptStep(BaseModel):
    id: str
    action: str
    label: str
    params: dict[str, str] = Field(default_factory=dict)


class TestScript(BaseModel):
    id: str
    name: str
    target_package: str = "com.ultron.player"
    launch_activity: str = "com.ultron.player/.MainActivity"
    steps: list[ScriptStep] = Field(default_factory=list)
    updated_at: str = ""


class CreateScriptRequest(BaseModel):
    name: str = Field(default="新劇本")


class UpdateScriptRequest(BaseModel):
    name: str
    target_package: str = "com.ultron.player"
    launch_activity: str = "com.ultron.player/.MainActivity"
    steps: list[ScriptStep]


class RunScriptRequest(BaseModel):
    device_id: str


class ScriptRunStepResult(BaseModel):
    step_index: int
    step_label: str
    status: str
    message: str = ""


class ScriptRunStatus(BaseModel):
    run_id: str
    script_id: str
    device_id: str
    state: str
    current_step: int
    results: list[ScriptRunStepResult]


class ProjectScheduleItem(BaseModel):
    id: int
    name: str = ""
    layout_id: int | None = None
    start_date: str = ""
    end_date: str = ""
    start_time: str = ""
    end_time: str = ""
    day_of_weeks: str = ""
    is_interrupt: bool = False


class TimeTableEntry(BaseModel):
    project_id: int
    media_id: int
    sequence: int = 0


class MediaScheduleItem(BaseModel):
    id: int
    name: str = ""
    type: str = ""
    duration_sec: int = 0
    start_date: str = ""
    end_date: str = ""
    file_name: str = ""


class TodaySchedule(BaseModel):
    date: str
    project_ids: list[int] = Field(default_factory=list)


class ScheduleMediaResponse(BaseModel):
    device_id: str
    projects: list[ProjectScheduleItem] = Field(default_factory=list)
    media: list[MediaScheduleItem] = Field(default_factory=list)
    time_table: list[TimeTableEntry] = Field(default_factory=list)
    today_schedule: TodaySchedule | None = None
    mock: bool = False
    error: str = ""
