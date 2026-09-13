import type { ReportDiff, ReportSummary } from '../types/api-types';

export const MOCK_REPORTS: ReportSummary[] = [
  { id: 'run-1', date: '2026-09-11 16:00', template: '冷啟動時間', pass_count: 2, fail_count: 1 },
  { id: 'run-2', date: '2026-09-10 11:20', template: 'Monkey 壓力測試', pass_count: 3, fail_count: 0 },
  { id: 'run-3', date: '2026-09-09 09:45', template: '長時間播放', pass_count: 1, fail_count: 2 },
];

export interface MockReportDetail extends ReportSummary {
  devices: Array<{ label: string; status: string; note: string }>;
}

export const MOCK_REPORT_DETAILS: Record<string, MockReportDetail> = {
  'run-1': {
    ...MOCK_REPORTS[0],
    devices: [
      { label: 'STB-176', status: 'Pass', note: '冷啟動 2.1 秒' },
      { label: 'STB-148', status: 'Pass', note: '冷啟動 2.4 秒' },
      { label: 'STB-Spare', status: 'Fail', note: '測試期間離線' },
    ],
  },
  'run-2': {
    ...MOCK_REPORTS[1],
    devices: [
      { label: 'STB-176', status: 'Pass', note: '500 次事件，0 崩潰' },
      { label: 'STB-148', status: 'Pass', note: '500 次事件，0 崩潰' },
      { label: 'STB-Spare', status: 'Pass', note: '500 次事件，0 崩潰' },
    ],
  },
  'run-3': {
    ...MOCK_REPORTS[2],
    devices: [
      { label: 'STB-176', status: 'Fail', note: '18 分鐘緩衝停滯' },
      { label: 'STB-148', status: 'Pass', note: '30 分鐘穩定' },
      { label: 'STB-Spare', status: 'Fail', note: '播放凍結' },
    ],
  },
};

export function getMockReportDiff(reportId: string): ReportDiff {
  return {
    report_id: reportId,
    baseline_label: '基準版 v10042',
    candidate_label: '候選版 v10053',
    diff_score: reportId === 'run-1' ? 12.4 : reportId === 'run-2' ? 3.1 : 18.7,
  };
}
