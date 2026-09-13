import { mockFetchReportDiff, mockFetchReportDetail, mockFetchReports } from '../lib/mock-api';
import { agentRequest } from './agent-client';
import type { ReportDiff, ReportSummary } from '../types/api-types';
import type { MockReportDetail } from '../data/mock-reports';

export async function fetchReports(): Promise<ReportSummary[]> {
  try {
    return await agentRequest<ReportSummary[]>('/api/reports');
  } catch {
    return mockFetchReports();
  }
}

export async function fetchReportDiff(reportId: string): Promise<ReportDiff> {
  try {
    return await agentRequest<ReportDiff>(`/api/reports/${reportId}/diff`);
  } catch {
    return mockFetchReportDiff(reportId);
  }
}

export async function fetchReportDetail(reportId: string): Promise<MockReportDetail | null> {
  try {
    await agentRequest<ReportSummary>(`/api/reports/${reportId}`);
    return mockFetchReportDetail(reportId);
  } catch {
    return mockFetchReportDetail(reportId);
  }
}
