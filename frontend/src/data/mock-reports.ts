import type { ReportDiff, ReportSummary } from '../types/api-types';

export const MOCK_REPORTS: ReportSummary[] = [
  { id: 'run-1', date: '2026-09-11 16:00', template: 'Cold start time', pass_count: 2, fail_count: 1 },
  { id: 'run-2', date: '2026-09-10 11:20', template: 'Monkey stress', pass_count: 3, fail_count: 0 },
  { id: 'run-3', date: '2026-09-09 09:45', template: 'Long playback', pass_count: 1, fail_count: 2 },
];

export interface MockReportDetail extends ReportSummary {
  devices: Array<{ label: string; status: string; note: string }>;
}

export const MOCK_REPORT_DETAILS: Record<string, MockReportDetail> = {
  'run-1': {
    ...MOCK_REPORTS[0],
    devices: [
      { label: 'STB-LivingRoom', status: 'Pass', note: 'Cold start 2.1s' },
      { label: 'STB-QA-Bench', status: 'Pass', note: 'Cold start 2.4s' },
      { label: 'STB-Spare', status: 'Fail', note: 'Offline during run' },
    ],
  },
  'run-2': {
    ...MOCK_REPORTS[1],
    devices: [
      { label: 'STB-LivingRoom', status: 'Pass', note: '500 events, 0 crash' },
      { label: 'STB-QA-Bench', status: 'Pass', note: '500 events, 0 crash' },
      { label: 'STB-Spare', status: 'Pass', note: '500 events, 0 crash' },
    ],
  },
  'run-3': {
    ...MOCK_REPORTS[2],
    devices: [
      { label: 'STB-LivingRoom', status: 'Fail', note: 'Buffer stall at 18m' },
      { label: 'STB-QA-Bench', status: 'Pass', note: '30m stable' },
      { label: 'STB-Spare', status: 'Fail', note: 'Playback freeze' },
    ],
  },
};

export function getMockReportDiff(reportId: string): ReportDiff {
  return {
    report_id: reportId,
    baseline_label: 'Baseline v10042',
    candidate_label: 'Candidate v10053',
    diff_score: reportId === 'run-1' ? 12.4 : reportId === 'run-2' ? 3.1 : 18.7,
  };
}
