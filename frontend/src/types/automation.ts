export type TemplateId = 'cold-start' | 'monkey' | 'long-play' | 'reboot-net';

export type DeviceRunStatus = 'pass' | 'fail';

export type StepStatus = 'pass' | 'fail';

export interface AutomationParams {
  package_name?: string;
  monkey_events?: number;
  duration_minutes?: number;
  launch_time_max_ms?: number;
}

export interface RunAutomationRequest {
  template_id: TemplateId;
  device_ids: string[];
  params: AutomationParams;
}

export interface RunStep {
  name: string;
  status: StepStatus;
  detail: string | null;
}

export interface DeviceRunResult {
  device_id: string;
  device_label: string;
  status: DeviceRunStatus;
  steps: RunStep[];
  error: string | null;
}

export interface RunSummaryCounts {
  pass: number;
  fail: number;
}

export interface RunAutomationResponse {
  run_id: string;
  status: 'completed' | 'failed';
  summary: RunSummaryCounts;
  devices: DeviceRunResult[];
}

export interface RunSummary {
  id: string;
  started_at: string;
  finished_at: string;
  template_id: TemplateId;
  template_name: string;
  pass: number;
  fail: number;
  device_count: number;
}

export interface StoredDeviceResult extends DeviceRunResult {
  log_path: string | null;
  screenshot_path: string | null;
}

export interface RunDetail {
  id: string;
  template_id: TemplateId;
  template_name: string;
  started_at: string;
  finished_at: string;
  params: AutomationParams;
  summary: RunSummaryCounts;
  devices: StoredDeviceResult[];
}
