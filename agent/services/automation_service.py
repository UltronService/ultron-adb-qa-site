import asyncio
import uuid
from dataclasses import dataclass, field

from models.schemas import (
    AutomationProgressRow,
    AutomationRunStatus,
    AutomationTemplate,
)


@dataclass
class AutomationJob:
    run_id: str
    template_id: str
    device_ids: list[str]
    params: dict[str, str]
    state: str = "running"
    progress: list[AutomationProgressRow] = field(default_factory=list)


class AutomationService:
    TEMPLATES: list[AutomationTemplate] = [
        AutomationTemplate(
            id="cold-start",
            name="Cold start time",
            description="Measure app launch to first frame.",
        ),
        AutomationTemplate(
            id="monkey",
            name="Monkey stress",
            description="Random UI stress with configurable taps.",
        ),
        AutomationTemplate(
            id="long-play",
            name="Long playback",
            description="Monitor playback stability over time.",
        ),
        AutomationTemplate(
            id="reboot-net",
            name="Reboot network restore",
            description="Reboot loop and verify network recovery.",
        ),
    ]

    def __init__(self) -> None:
        self._jobs: dict[str, AutomationJob] = {}

    def list_templates(self) -> list[AutomationTemplate]:
        return list(self.TEMPLATES)

    async def start_run(
        self,
        template_id: str,
        device_ids: list[str],
        params: dict[str, str],
    ) -> AutomationRunStatus:
        if not device_ids:
            raise ValueError("At least one device is required")

        template = next((item for item in self.TEMPLATES if item.id == template_id), None)
        if template is None:
            raise ValueError("Unknown template")

        run_id = str(uuid.uuid4())
        job = AutomationJob(
            run_id=run_id,
            template_id=template_id,
            device_ids=device_ids,
            params=params,
            progress=[
                AutomationProgressRow(
                    device_label=device_id,
                    step="Queued",
                    status="Running",
                )
                for device_id in device_ids
            ],
        )
        self._jobs[run_id] = job
        asyncio.create_task(self._simulate_run(job))
        return self.get_status(run_id)

    def get_status(self, run_id: str) -> AutomationRunStatus:
        job = self._jobs.get(run_id)
        if job is None:
            raise KeyError("Run not found")

        return AutomationRunStatus(
            run_id=job.run_id,
            template_id=job.template_id,
            state=job.state,
            progress=list(job.progress),
        )

    async def _simulate_run(self, job: AutomationJob) -> None:
        steps = ["Launch app", "Execute template", "Collect metrics"]
        for step in steps:
            await asyncio.sleep(1)
            for row in job.progress:
                if row.status == "Running":
                    row.step = step
            if step == "Collect metrics":
                for index, row in enumerate(job.progress):
                    row.status = "Pass" if index % 2 == 0 else "Fail"
        job.state = "completed"
