import type { AutomationProgressRow, AutomationRunStatus, AutomationTemplate } from '../types/api-types';

export const MOCK_AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  { id: 'cold-start', name: 'Cold start time', description: 'Measure app launch to first frame.' },
  { id: 'monkey', name: 'Monkey stress', description: 'Random UI stress with configurable taps.' },
  { id: 'long-play', name: 'Long playback', description: 'Monitor playback stability over time.' },
  { id: 'reboot-net', name: 'Reboot network restore', description: 'Reboot loop and verify network recovery.' },
];

export function buildMockAutomationProgress(
  templateId: string,
  deviceLabels: string[],
  tick: number,
): AutomationProgressRow[] {
  const stepsByTemplate: Record<string, string[]> = {
    'cold-start': ['Launch app', 'Wait first frame', 'Capture screenshot', 'Done'],
    monkey: ['Install APK', 'Monkey events', 'Collect crashes', 'Done'],
    'long-play': ['Start playback', 'Monitor buffer', 'Check memory', 'Done'],
    'reboot-net': ['Reboot STB', 'Wait boot', 'Verify network', 'Done'],
  };
  const steps = stepsByTemplate[templateId] ?? ['Running', 'Done'];
  const stepIndex = Math.min(tick, steps.length - 1);
  const currentStep = steps[stepIndex] ?? 'Done';

  return deviceLabels.map((label, index) => {
    const deviceTick = Math.max(0, tick - index);
    const deviceStepIndex = Math.min(deviceTick, steps.length - 1);
    const step = steps[deviceStepIndex] ?? 'Done';
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
