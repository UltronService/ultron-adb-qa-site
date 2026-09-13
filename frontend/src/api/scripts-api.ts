import {
  mockCreateScript,
  mockDeleteScript,
  mockFetchScriptRunStatus,
  mockFetchScripts,
  mockRunScriptTrial,
  mockUpdateScript,
} from '../lib/mock-api';
import { agentRequest } from './agent-client';
import type { ScriptRunStatus, TestScript } from '../data/script-step-catalog';

export async function fetchScripts(): Promise<TestScript[]> {
  try {
    return await agentRequest<TestScript[]>('/api/scripts');
  } catch {
    return mockFetchScripts();
  }
}

export async function createScript(name: string): Promise<TestScript> {
  try {
    return await agentRequest<TestScript>('/api/scripts', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  } catch {
    return mockCreateScript(name);
  }
}

export async function updateScript(script: TestScript): Promise<TestScript> {
  try {
    return await agentRequest<TestScript>(`/api/scripts/${script.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: script.name,
        target_package: script.target_package,
        launch_activity: script.launch_activity,
        steps: script.steps,
      }),
    });
  } catch {
    return mockUpdateScript(script);
  }
}

export async function deleteScript(scriptId: string): Promise<void> {
  try {
    await agentRequest(`/api/scripts/${scriptId}`, {
      method: 'DELETE',
      parseJson: false,
    });
  } catch {
    mockDeleteScript(scriptId);
  }
}

export async function runScriptTrial(
  scriptId: string,
  deviceId: string,
): Promise<ScriptRunStatus> {
  try {
    return await agentRequest<ScriptRunStatus>(`/api/scripts/${scriptId}/run`, {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId }),
    });
  } catch {
    return mockRunScriptTrial(scriptId, deviceId);
  }
}

export async function fetchScriptRunStatus(runId: string): Promise<ScriptRunStatus> {
  if (runId.startsWith('mock-script-')) {
    return mockFetchScriptRunStatus(runId);
  }
  try {
    return await agentRequest<ScriptRunStatus>(`/api/scripts/runs/${runId}`);
  } catch {
    return mockFetchScriptRunStatus(runId);
  }
}

export function isMockScriptRun(runId: string): boolean {
  return runId.startsWith('mock-script-');
}
