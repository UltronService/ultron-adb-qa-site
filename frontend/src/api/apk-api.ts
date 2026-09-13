import { mockFetchApks, mockInstallApk, mockUploadApk } from '../lib/mock-api';
import { agentRequest } from './agent-client';
import type { ApkInfo } from '../types/api-types';

export async function fetchApks(): Promise<ApkInfo[]> {
  try {
    return await agentRequest<ApkInfo[]>('/api/apk');
  } catch {
    return mockFetchApks();
  }
}

export async function uploadApk(file: File, notes: string): Promise<ApkInfo> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('notes', notes);
    return await agentRequest<ApkInfo>('/api/apk/upload', {
      method: 'POST',
      body: formData,
      parseJson: true,
    });
  } catch {
    return mockUploadApk(file, notes);
  }
}

export async function installApk(
  apkId: string,
  deviceIds: string[],
): Promise<Record<string, string>> {
  try {
    return await agentRequest<Record<string, string>>('/api/apk/install', {
      method: 'POST',
      body: JSON.stringify({ apk_id: apkId, device_ids: deviceIds }),
    });
  } catch {
    return mockInstallApk(apkId, deviceIds);
  }
}
