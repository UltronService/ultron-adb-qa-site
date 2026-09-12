import { agentRequest } from './agent-client';
import type { ReportDiff, ReportSummary } from '../types/api-types';

export async function fetchReports(): Promise<ReportSummary[]> {
  return agentRequest<ReportSummary[]>('/api/reports');
}

export async function fetchReportDiff(reportId: string): Promise<ReportDiff> {
  return agentRequest<ReportDiff>(`/api/reports/${reportId}/diff`);
}
