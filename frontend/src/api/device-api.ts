import { agentRequest } from './agent-client';
import type { DeviceInfo } from '../types/api-types';

export async function fetchDevices(): Promise<DeviceInfo[]> {
  return agentRequest<DeviceInfo[]>('/api/devices');
}

export async function connectDevice(address: string): Promise<DeviceInfo> {
  return agentRequest<DeviceInfo>('/api/devices/connect', {
    method: 'POST',
    body: JSON.stringify({ address }),
  });
}

export async function scanDevices(): Promise<DeviceInfo[]> {
  return agentRequest<DeviceInfo[]>('/api/devices/scan', {
    method: 'POST',
  });
}
