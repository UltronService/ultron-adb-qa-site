import { MOCK_APKS } from '../data/mock-apks';
import {
  createMockAutomationJob,
  toAutomationRunStatus,
  type MockAutomationJob,
  MOCK_AUTOMATION_TEMPLATES,
} from '../data/mock-automation';
import { buildMockLogcatExport } from '../data/mock-logcat';
import { MOCK_REPORTS, MOCK_REPORT_DETAILS, getMockReportDiff } from '../data/mock-reports';
import { mockScreenshotBase64 } from '../data/mock-screenshot';
import {
  MOCK_SCRIPTS,
  createMockScriptRunJob,
  toScriptRunStatus,
  type MockScriptRunJob,
} from '../data/mock-scripts';
import { createStepId, type ScriptRunStatus, type TestScript } from '../data/script-step-catalog';
import { getMockDevices } from './map-mock-device';
import type {
  ApkInfo,
  AutomationRunStatus,
  AutomationTemplate,
  DeviceInfo,
  ReportDiff,
  ReportSummary,
} from '../types/api-types';

const mockApkStore: ApkInfo[] = [...MOCK_APKS];
const mockScriptStore: TestScript[] = [...MOCK_SCRIPTS];
const automationJobs = new Map<string, MockAutomationJob>();
const scriptJobs = new Map<string, MockScriptRunJob>();

export function mockFetchDevices() {
  return getMockDevices();
}

export function mockFetchApks(): ApkInfo[] {
  return [...mockApkStore];
}

export function mockUploadApk(file: File, notes: string): ApkInfo {
  const apk: ApkInfo = {
    id: `apk-mock-${Date.now()}`,
    app_name: file.name.replace(/\.apk$/i, ''),
    package_name: 'com.ultron.player',
    version_name: '1.0.0',
    version_code: 10000 + mockApkStore.length,
    size_mb: Math.round((file.size / (1024 * 1024)) * 10) / 10,
    uploaded_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    notes: notes || 'Uploaded in demo mode',
    launch_activity: 'com.ultron.player/.MainActivity',
  };
  mockApkStore.unshift(apk);
  return apk;
}

export function mockInstallApk(_apkId: string, deviceIds: string[]): Record<string, string> {
  const results: Record<string, string> = {};
  for (const deviceId of deviceIds) {
    results[deviceId] = '[demo] 已安裝並啟動 com.ultron.player';
  }
  return results;
}

export function mockFetchAutomationTemplates(): AutomationTemplate[] {
  return MOCK_AUTOMATION_TEMPLATES;
}

export function mockStartAutomationRun(
  templateId: string,
  deviceIds: string[],
): AutomationRunStatus {
  const labels = deviceIds.map((id) => getMockDevices().find((d) => d.id === id)?.label ?? id);
  const job = createMockAutomationJob(templateId, labels);
  automationJobs.set(job.run_id, job);
  return toAutomationRunStatus(job);
}

export function mockAdvanceAutomationRun(runId: string): AutomationRunStatus | null {
  const job = automationJobs.get(runId);
  if (!job) {
    return null;
  }
  job.tick += 1;
  if (job.tick >= 5) {
    job.state = 'completed';
  }
  automationJobs.set(runId, job);
  return toAutomationRunStatus(job);
}

export function mockStopAutomationRun(runId: string): AutomationRunStatus | null {
  const job = automationJobs.get(runId);
  if (!job) {
    return null;
  }
  job.state = 'stopped';
  automationJobs.set(runId, job);
  return toAutomationRunStatus(job);
}

export function mockFetchAutomationRunStatus(runId: string): AutomationRunStatus {
  const job = automationJobs.get(runId);
  if (!job) {
    throw new Error('Mock automation run not found');
  }
  return toAutomationRunStatus(job);
}

export function mockFetchReports(): ReportSummary[] {
  return MOCK_REPORTS;
}

export function mockFetchReportDiff(reportId: string): ReportDiff {
  return getMockReportDiff(reportId);
}

export function mockFetchReportDetail(reportId: string) {
  return MOCK_REPORT_DETAILS[reportId] ?? null;
}

export function mockFetchScripts(): TestScript[] {
  return [...mockScriptStore];
}

export function mockCreateScript(name: string): TestScript {
  const script: TestScript = {
    id: `script-${Date.now()}`,
    name,
    target_package: 'com.ultron.player',
    launch_activity: 'com.ultron.player/.MainActivity',
    steps: [],
    updated_at: new Date().toISOString(),
  };
  mockScriptStore.unshift(script);
  return script;
}

export function mockUpdateScript(script: TestScript): TestScript {
  const index = mockScriptStore.findIndex((item) => item.id === script.id);
  const updated = { ...script, updated_at: new Date().toISOString() };
  if (index >= 0) {
    mockScriptStore[index] = updated;
  } else {
    mockScriptStore.unshift(updated);
  }
  return updated;
}

export function mockDeleteScript(scriptId: string): void {
  const index = mockScriptStore.findIndex((item) => item.id === scriptId);
  if (index >= 0) {
    mockScriptStore.splice(index, 1);
  }
}

export function mockRunScriptTrial(scriptId: string, deviceId: string): ScriptRunStatus {
  const script = mockScriptStore.find((item) => item.id === scriptId);
  if (!script) {
    throw new Error('Mock script not found');
  }
  const job = createMockScriptRunJob(script, deviceId);
  scriptJobs.set(job.run_id, job);
  return toScriptRunStatus(job);
}

export function mockAdvanceScriptRun(runId: string): ScriptRunStatus | null {
  const job = scriptJobs.get(runId);
  if (!job || job.state !== 'running') {
    return job ? toScriptRunStatus(job) : null;
  }
  job.current_step += 1;
  if (job.current_step >= job.script.steps.length) {
    job.state = 'completed';
  }
  scriptJobs.set(runId, job);
  return toScriptRunStatus(job);
}

export function mockFetchScriptRunStatus(runId: string): ScriptRunStatus {
  const job = scriptJobs.get(runId);
  if (!job) {
    throw new Error('Mock script run not found');
  }
  return toScriptRunStatus(job);
}

export function mockCaptureScreenshot() {
  return { image_base64: mockScreenshotBase64(), mock: 'true' as const };
}

export function mockExportLogcat(packageName: string, logLevel: string) {
  const content = buildMockLogcatExport(packageName, logLevel);
  return {
    filename: `logcat-demo-${Date.now()}.log`,
    line_count: content.split('\n').length,
    content,
    mock: 'true' as const,
  };
}

export function mockConnectDevice(ip: string): DeviceInfo {
  const device: DeviceInfo = {
    id: `stb-mock-${Date.now()}`,
    label: `STB-${ip.split('.').pop() ?? 'new'}`,
    ip,
    online: true,
    model: 'Demo STB',
    android_version: '11',
    cpu_percent: 15,
    ram_percent: 42,
    ping_ms: 3,
  };
  return device;
}

export { createStepId };
