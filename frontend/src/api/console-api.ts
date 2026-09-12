import { agentRequest } from './agent-client';

interface ScreenshotResponse {
  image_base64: string;
  mock: string;
}

export async function captureScreenshot(deviceId: string): Promise<ScreenshotResponse> {
  return agentRequest<ScreenshotResponse>(`/api/console/${deviceId}/screenshot`, {
    method: 'POST',
  });
}

export async function sendKeyEvent(deviceId: string, keycode: string): Promise<void> {
  await agentRequest(`/api/console/${deviceId}/key`, {
    method: 'POST',
    body: JSON.stringify({ keycode }),
  });
}

export async function sendTextInput(deviceId: string, text: string): Promise<void> {
  await agentRequest(`/api/console/${deviceId}/text`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export function openLogcatStream(deviceId: string): WebSocket {
  const baseUrl = import.meta.env.VITE_AGENT_URL ?? 'http://127.0.0.1:8000';
  const wsBase = baseUrl.replace(/^http/, 'ws').replace(/\/$/, '');
  return new WebSocket(`${wsBase}/api/console/${deviceId}/logcat`);
}
