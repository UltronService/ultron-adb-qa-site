from datetime import datetime

from models.schemas import ReportDiff, ReportSummary
from services.run_storage_service import get_run, list_runs


class ReportsService:
    def _format_date(self, iso_date: str) -> str:
        try:
            parsed = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
            return parsed.strftime("%Y-%m-%d %H:%M")
        except ValueError:
            return iso_date

    def list_reports(self) -> list[ReportSummary]:
        runs = list_runs()
        if not runs:
            return []

        return [
            ReportSummary(
                id=run.id,
                date=self._format_date(run.started_at),
                template=run.template_name,
                pass_count=run.pass_count,
                fail_count=run.fail,
            )
            for run in runs
        ]

    def get_report(self, report_id: str) -> ReportSummary:
        for report in self.list_reports():
            if report.id == report_id:
                return report
        raise KeyError("Report not found")

    def get_diff(self, report_id: str) -> ReportDiff:
        detail = get_run(report_id)
        if detail is None:
            self.get_report(report_id)

        return ReportDiff(
            report_id=report_id,
            baseline_label="Baseline screenshot",
            candidate_label="Candidate screenshot",
            diff_score=12.4,
        )
