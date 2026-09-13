import type { AutomationProgressRow, AutomationRunStatus, AutomationTemplate } from '../types/api-types';

export const MOCK_AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  { id: 'cold-start', name: '冷啟動時間', description: '量測 App 啟動至首幀的時間。' },
  { id: 'monkey', name: 'Monkey 壓力測試', description: '可設定點擊次數的隨機 UI 壓力測試。' },
  { id: 'long-play', name: '長時間播放', description: '監控長時間播放的穩定性。' },
  { id: 'reboot-net', name: '重開機網路恢復', description: '重開機循環並驗證網路恢復。' },
];

export function buildMockAutomationProgress(
  templateId: string,
  deviceLabels: string[],
  tick: number,
): AutomationProgressRow[] {
  const stepsByTemplate: Record<string, string[]> = {
    'cold-start': ['啟動 App', '等待首幀', '擷取截圖', '完成'],
    monkey: ['安裝 APK', 'Monkey 事件', '收集崩潰', '完成'],
    'long-play': ['開始播放', '監控緩衝', '檢查記憶體', '完成'],
    'reboot-net': ['重開 STB', '等待開機', '驗證網路', '完成'],
  };
  const steps = stepsByTemplate[templateId] ?? ['執行中', '完成'];
  const stepIndex = Math.min(tick, steps.length - 1);
  const currentStep = steps[stepIndex] ?? '完成';

  return deviceLabels.map((label, index) => {
    const deviceTick = Math.max(0, tick - index);
    const deviceStepIndex = Math.min(deviceTick, steps.length - 1);
    const step = steps[deviceStepIndex] ?? '完成';
    let status = 'Running';
    if (deviceStepIndex >= steps.length - 1) {
      status = index === 1 && templateId === 'monkey' ? 'Fail' : 'Pass';
    }
    if (step === currentStep && deviceStepIndex < steps.length - 1) {
      status = 'Running';
    }
    return { device_label: label, step, status };
  });
}

export function isMockAutomationComplete(tick: number, templateId: string): boolean {
  const stepCount = templateId === 'cold-start' ? 4 : 4;
  return tick >= stepCount + 1;
}

export interface MockAutomationJob {
  run_id: string;
  template_id: string;
  state: string;
  tick: number;
  device_labels: string[];
}

export function createMockAutomationJob(
  templateId: string,
  deviceLabels: string[],
): MockAutomationJob {
  return {
    run_id: `mock-auto-${Date.now()}`,
    template_id: templateId,
    state: 'running',
    tick: 0,
    device_labels: deviceLabels,
  };
}

export function toAutomationRunStatus(job: MockAutomationJob): AutomationRunStatus {
  const complete = isMockAutomationComplete(job.tick, job.template_id);
  return {
    run_id: job.run_id,
    template_id: job.template_id,
    state: complete ? 'completed' : job.state,
    progress: buildMockAutomationProgress(job.template_id, job.device_labels, job.tick),
  };
}
