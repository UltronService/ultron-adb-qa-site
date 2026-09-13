import { ULTRON_PLAYER_APK_SOURCE } from './ultron-player-apk';
import type { ScriptRunStatus, TestScript } from './script-step-catalog';

export const MOCK_SCRIPTS: TestScript[] = [
  {
    id: 'preset-cold-start',
    name: 'Ultron 冷啟動',
    target_package: ULTRON_PLAYER_APK_SOURCE.packageName,
    launch_activity: ULTRON_PLAYER_APK_SOURCE.launchActivity,
    steps: [
      { id: 's1', action: 'launch', label: '開啟 Ultron Player', params: {} },
      { id: 's2', action: 'wait', label: '等待 5 秒', params: { seconds: '5' } },
      { id: 's3', action: 'screenshot', label: '截圖：啟動後畫面', params: { name: 'cold-start' } },
    ],
    updated_at: '2026-09-12T10:00:00Z',
  },
  {
    id: 'preset-basic-nav',
    name: 'Ultron 基本導航',
    target_package: ULTRON_PLAYER_APK_SOURCE.packageName,
    launch_activity: ULTRON_PLAYER_APK_SOURCE.launchActivity,
    steps: [
      { id: 's1', action: 'launch', label: '開啟 Ultron Player', params: {} },
      { id: 's2', action: 'wait', label: '等待 3 秒', params: { seconds: '3' } },
      { id: 's3', action: 'key', label: '按 OK', params: { key: 'ok', keycode: '23' } },
      { id: 's4', action: 'key', label: '按 返回', params: { key: 'back', keycode: '4' } },
      { id: 's5', action: 'screenshot', label: '截圖：導航後', params: { name: 'after-nav' } },
    ],
    updated_at: '2026-09-12T10:00:00Z',
  },
];

export interface MockScriptRunJob {
  run_id: string;
  script_id: string;
  device_id: string;
  script: TestScript;
  current_step: number;
  state: string;
}

export function createMockScriptRunJob(script: TestScript, deviceId: string): MockScriptRunJob {
  return {
    run_id: `mock-script-${Date.now()}`,
    script_id: script.id,
    device_id: deviceId,
    script,
    current_step: 0,
    state: 'running',
  };
}

export function toScriptRunStatus(job: MockScriptRunJob): ScriptRunStatus {
  const results = job.script.steps.map((step, index) => {
    if (index < job.current_step) {
      return {
        step_index: index,
        step_label: step.label,
        status: 'pass',
        message: `[demo] ${step.label} 完成`,
      };
    }
    if (index === job.current_step && job.state === 'running') {
      return {
        step_index: index,
        step_label: step.label,
        status: 'running',
        message: `[demo] 執行中…`,
      };
    }
    return {
      step_index: index,
      step_label: step.label,
      status: 'pending',
      message: '等待中',
    };
  });

  const state = job.state === 'running' && job.current_step >= job.script.steps.length
    ? 'completed'
    : job.state;

  return {
    run_id: job.run_id,
    script_id: job.script_id,
    device_id: job.device_id,
    state,
    current_step: job.current_step,
    results,
  };
}
