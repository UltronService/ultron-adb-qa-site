import { agentRequest } from './agent-client';
import type { AutomationRunStatus, AutomationTemplate } from '../types/api-types';

export async function fetchAutomationTemplates(): Promise<AutomationTemplate[]> {
  return agentRequest<AutomationTemplate[]>('/api/automation/templates');
}

export async function startAutomationRun(
  templateId: string,
  deviceIds: string[],
  params: Record<string, string>,
): Promise<AutomationRunStatus> {
  return agentRequest<AutomationRunStatus>('/api/automation/run', {
    method: 'POST',
    body: JSON.stringify({
      template_id: templateId,
      device_ids: deviceIds,
      params,
    }),
  });
}

export async function fetchAutomationRunStatus(runId: string): Promise<AutomationRunStatus> {
  return agentRequest<AutomationRunStatus>(`/api/automation/runs/${runId}`);
}
