import { ULTRON_PLAYER_APK_SOURCE } from '../data/ultron-player-apk';
import {
  mockFetchAutomationRunStatus,
  mockFetchAutomationTemplates,
  mockStartAutomationRun,
} from '../lib/mock-api';
import { agentRequest } from './agent-client';
import type { AutomationRunStatus, AutomationTemplate } from '../types/api-types';

function isAgentUnreachable(error: unknown): boolean {
  return error instanceof TypeError;
}

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
        params: {
          ...params,
          package_name: params.package_name ?? ULTRON_PLAYER_APK_SOURCE.packageName,
        },
      }),
    });
  } catch (error) {
    if (!isAgentUnreachable(error)) {
      throw error;
    }
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
