export interface ScriptStep {
  id: string;
  action: string;
  label: string;
  params: Record<string, string>;
}

export interface TestScript {
  id: string;
  name: string;
  target_package: string;
  launch_activity: string;
  steps: ScriptStep[];
  updated_at: string;
}

export interface ScriptRunStepResult {
  step_index: number;
  step_label: string;
  status: string;
  message: string;
}

export interface ScriptRunStatus {
  run_id: string;
  script_id: string;
  device_id: string;
  state: string;
  current_step: number;
  results: ScriptRunStepResult[];
}

export interface StepCatalogItem {
  action: string;
  toolboxLabel: string;
  defaultLabel: string;
  defaultParams: Record<string, string>;
}

export const REMOTE_KEY_OPTIONS = [
  { key: 'up', label: '上', keycode: '19' },
  { key: 'down', label: '下', keycode: '20' },
  { key: 'left', label: '左', keycode: '21' },
  { key: 'right', label: '右', keycode: '22' },
  { key: 'ok', label: 'OK', keycode: '23' },
  { key: 'back', label: '返回', keycode: '4' },
  { key: 'home', label: '首頁', keycode: '3' },
  { key: 'menu', label: '選單', keycode: '82' },
] as const;

export const STEP_CATALOG: StepCatalogItem[] = [
  {
    action: 'launch',
    toolboxLabel: '開啟 App',
    defaultLabel: '開啟 Ultron Player',
    defaultParams: {},
  },
  {
    action: 'key',
    toolboxLabel: '按遙控鍵',
    defaultLabel: '按 OK',
    defaultParams: { key: 'ok', keycode: '23' },
  },
  {
    action: 'wait',
    toolboxLabel: '等待',
    defaultLabel: '等待 5 秒',
    defaultParams: { seconds: '5' },
  },
  {
    action: 'text',
    toolboxLabel: '輸入文字',
    defaultLabel: '輸入文字',
    defaultParams: { text: '' },
  },
  {
    action: 'screenshot',
    toolboxLabel: '截圖',
    defaultLabel: '截圖',
    defaultParams: { name: 'step-screenshot' },
  },
  {
    action: 'logcat_export',
    toolboxLabel: '匯出 Log',
    defaultLabel: '匯出 Log',
    defaultParams: {},
  },
];

export function createStepId(): string {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function buildStepFromCatalog(catalog: StepCatalogItem): ScriptStep {
  return {
    id: createStepId(),
    action: catalog.action,
    label: catalog.defaultLabel,
    params: { ...catalog.defaultParams },
  };
}
