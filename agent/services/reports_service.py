from models.schemas import ReportDiff, ReportSummary


class ReportsService:
    def __init__(self) -> None:
        self._reports: list[ReportSummary] = [
            ReportSummary(
                id="run-1",
                date="2026-09-11 16:00",
                template="Cold start time",
                pass_count=2,
                fail_count=1,
            ),
            ReportSummary(
                id="run-2",
                date="2026-09-10 11:20",
                template="Monkey stress",
                pass_count=3,
                fail_count=0,
            ),
            ReportSummary(
                id="run-3",
                date="2026-09-09 09:45",
                template="Long playback",
                pass_count=1,
                fail_count=2,
            ),
        ]

    def list_reports(self) -> list[ReportSummary]:
        return list(self._reports)

    def get_report(self, report_id: str) -> ReportSummary:
        for report in self._reports:
            if report.id == report_id:
                return report
        raise KeyError("Report not found")

    def get_diff(self, report_id: str) -> ReportDiff:
        self.get_report(report_id)
        return ReportDiff(
            report_id=report_id,
            baseline_label="Baseline screenshot",
            candidate_label="Candidate screenshot",
            diff_score=12.4,
        )
