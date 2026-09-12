import { agentRequest } from './agent-client';
import type { ApkInfo } from '../types/api-types';

export async function fetchApks(): Promise<ApkInfo[]> {
  return agentRequest<ApkInfo[]>('/api/apk');
}

export async function uploadApk(file: File, notes: string): Promise<ApkInfo> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('notes', notes);

  return agentRequest<ApkInfo>('/api/apk/upload', {
    method: 'POST',
    body: formData,
    parseJson: true,
  });
}

export async function installApk(
  apkId: string,
  deviceIds: string[],
): Promise<Record<string, string>> {
  return agentRequest<Record<string, string>>('/api/apk/install', {
    method: 'POST',
    body: JSON.stringify({ apk_id: apkId, device_ids: deviceIds }),
  });
}
