export interface DeviceInfo {
  id: string;
  label: string;
  ip: string;
  online: boolean;
  model: string;
  android_version: string;
  cpu_percent: number;
  ram_percent: number;
  ping_ms: number;
}

export interface ApkInfo {
  id: string;
  app_name: string;
  package_name: string;
  version_name: string;
  version_code: number;
  size_mb: number;
  uploaded_at: string;
  notes: string;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
}

export interface AutomationProgressRow {
  device_label: string;
  step: string;
  status: string;
}

export interface AutomationRunStatus {
  run_id: string;
  template_id: string;
  state: string;
  progress: AutomationProgressRow[];
}

export interface ReportSummary {
  id: string;
  date: string;
  template: string;
  pass_count: number;
  fail_count: number;
}

export interface ReportDiff {
  report_id: string;
  baseline_label: string;
  candidate_label: string;
  diff_score: number;
}
