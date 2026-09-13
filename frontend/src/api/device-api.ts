import { getMockDevices } from '../lib/map-mock-device';
import { mockConnectDevice } from '../lib/mock-api';
import { agentRequest } from './agent-client';
import type { DeviceInfo } from '../types/api-types';

export async function fetchDevices(): Promise<DeviceInfo[]> {
  try {
    return await agentRequest<DeviceInfo[]>('/api/devices');
  } catch {
    return getMockDevices();
  }
}

export async function connectDevice(address: string): Promise<DeviceInfo> {
  try {
    return await agentRequest<DeviceInfo>('/api/devices/connect', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  } catch {
    return mockConnectDevice(address);
  }
}

export async function scanDevices(): Promise<DeviceInfo[]> {
  try {
    return await agentRequest<DeviceInfo[]>('/api/devices/scan', {
      method: 'POST',
    });
  } catch {
    return getMockDevices();
  }
}
