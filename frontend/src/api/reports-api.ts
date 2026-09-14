import { mockFetchReportDiff, mockFetchReportDetail, mockFetchReports } from '../lib/mock-api';
import { agentRequest } from './agent-client';
import type { ReportDiff, ReportSummary } from '../types/api-types';
import type { MockReportDetail } from '../data/mock-reports';

function isAgentUnreachable(error: unknown): boolean {
  return error instanceof TypeError;
}

interface RunDetailResponse {
  id: string;
  template_name: string;
  started_at: string;
  summary: { pass_count: number; fail: number };
  devices: Array<{
    device_label: string;
    status: string;
    error: string | null;
    steps: Array<{ name: string; status: string; detail?: string | null }>;
  }>;
}

function formatReportDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return parsed.toISOString().slice(0, 16).replace('T', ' ');
}

export async function fetchReports(): Promise<ReportSummary[]> {
  try {
    const result = await agentRequest<ReportSummary[]>('/api/reports');
    return Array.isArray(result) ? result : [];
  } catch (error) {
    if (!isAgentUnreachable(error)) {
      throw error;
    }
    return mockFetchReports();
  }
}

export async function fetchReportDiff(reportId: string): Promise<ReportDiff> {
  try {
    return await agentRequest<ReportDiff>(`/api/reports/${reportId}/diff`);
  } catch (error) {
    if (!isAgentUnreachable(error)) {
      throw error;
    }
    return mockFetchReportDiff(reportId);
  }
}

export async function fetchReportDetail(reportId: string): Promise<MockReportDetail | null> {
  try {
    const detail = await agentRequest<RunDetailResponse>(`/api/runs/${reportId}`);
    return {
      id: detail.id,
      date: formatReportDate(detail.started_at),
      template: detail.template_name,
      pass_count: detail.summary.pass_count,
      fail_count: detail.summary.fail,
      devices: detail.devices.map((device) => ({
        label: device.device_label,
        status: device.status,
        note:
          device.error ||
          device.steps
            .map((step) => (step.detail ? `${step.name}: ${step.detail}` : step.name))
            .join(' · ') ||
          '',
      })),
    };
  } catch (error) {
    if (!isAgentUnreachable(error)) {
      throw error;
    }
    return mockFetchReportDetail(reportId);
  }
}
