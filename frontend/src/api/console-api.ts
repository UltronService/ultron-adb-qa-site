import { agentRequest, getAgentWebSocketBase } from './agent-client';

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

export interface LogcatStreamOptions {
  packageName?: string;
  level?: string;
}

export function openLogcatStream(deviceId: string, options: LogcatStreamOptions = {}): WebSocket {
  const wsBase = getAgentWebSocketBase();
  const params = new URLSearchParams();
  if (options.packageName) {
    params.set('package', options.packageName);
  }
  if (options.level) {
    params.set('level', options.level);
  }
  const query = params.toString();
  const suffix = query ? `?${query}` : '';
  return new WebSocket(`${wsBase}/api/console/${deviceId}/logcat${suffix}`);
}

export interface LogcatExportResponse {
  filename: string;
  line_count: number;
  content: string;
  mock: string;
}

export async function exportLogcat(
  deviceId: string,
  packageName: string,
  logLevel: string,
): Promise<LogcatExportResponse> {
  return agentRequest<LogcatExportResponse>(`/api/console/${deviceId}/logcat/export`, {
    method: 'POST',
    body: JSON.stringify({
      package_name: packageName,
      log_level: logLevel,
    }),
  });
}
