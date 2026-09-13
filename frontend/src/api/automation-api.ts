import {
  mockFetchAutomationRunStatus,
  mockFetchAutomationTemplates,
  mockStartAutomationRun,
} from '../lib/mock-api';
import { agentRequest } from './agent-client';
import type { AutomationRunStatus, AutomationTemplate } from '../types/api-types';

export async function fetchAutomationTemplates(): Promise<AutomationTemplate[]> {
  try {
    return await agentRequest<AutomationTemplate[]>('/api/automation/templates');
  } catch {
    return mockFetchAutomationTemplates();
  }
}

export async function startAutomationRun(
  templateId: string,
  deviceIds: string[],
  params: Record<string, string>,
): Promise<AutomationRunStatus> {
  try {
    return await agentRequest<AutomationRunStatus>('/api/automation/run', {
      method: 'POST',
      body: JSON.stringify({
        template_id: templateId,
        device_ids: deviceIds,
        params,
      }),
    });
  } catch {
    return mockStartAutomationRun(templateId, deviceIds);
  }
}

export async function fetchAutomationRunStatus(runId: string): Promise<AutomationRunStatus> {
  if (runId.startsWith('mock-auto-')) {
    return mockFetchAutomationRunStatus(runId);
  }
  try {
    return await agentRequest<AutomationRunStatus>(`/api/automation/runs/${runId}`);
  } catch {
    return mockFetchAutomationRunStatus(runId);
  }
}

export function isMockAutomationRun(runId: string): boolean {
  return runId.startsWith('mock-auto-');
}
