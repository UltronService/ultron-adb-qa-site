import { getMockScheduleMedia } from '../data/mock-schedule';
import { agentRequest } from './agent-client';
import type { ScheduleMediaResponse } from '../types/api-types';

export async function fetchScheduleMedia(deviceId: string): Promise<ScheduleMediaResponse> {
  const encodedId = encodeURIComponent(deviceId);
  try {
    return await agentRequest<ScheduleMediaResponse>(`/api/devices/${encodedId}/schedule-media`);
  } catch {
    return getMockScheduleMedia(deviceId);
  }
}
