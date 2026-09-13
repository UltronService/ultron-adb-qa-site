import { agentRequest } from './agent-client';
import type { ScriptRunStatus, TestScript } from '../data/script-step-catalog';

export async function fetchScripts(): Promise<TestScript[]> {
  return agentRequest<TestScript[]>('/api/scripts');
}

export async function createScript(name: string): Promise<TestScript> {
  return agentRequest<TestScript>('/api/scripts', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateScript(script: TestScript): Promise<TestScript> {
  return agentRequest<TestScript>(`/api/scripts/${script.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: script.name,
      target_package: script.target_package,
      launch_activity: script.launch_activity,
      steps: script.steps,
    }),
  });
}

export async function deleteScript(scriptId: string): Promise<void> {
  await agentRequest(`/api/scripts/${scriptId}`, {
    method: 'DELETE',
    parseJson: false,
  });
}

export async function runScriptTrial(
  scriptId: string,
  deviceId: string,
): Promise<ScriptRunStatus> {
  return agentRequest<ScriptRunStatus>(`/api/scripts/${scriptId}/run`, {
    method: 'POST',
    body: JSON.stringify({ device_id: deviceId }),
  });
}

export async function fetchScriptRunStatus(runId: string): Promise<ScriptRunStatus> {
  return agentRequest<ScriptRunStatus>(`/api/scripts/runs/${runId}`);
}
