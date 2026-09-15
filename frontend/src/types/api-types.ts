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
  product_brand?: string;
  product_manufacturer?: string;
  product_model?: string;
  brand_name?: string;
  branch_name?: string;
  player_device_id?: number | null;
  category_name?: string;
  installed_apk_version?: string;
  last_schedule_sync_at?: string;
  setup_box?: string;
  public_ip?: string;
  version_code?: string;
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
  launch_activity?: string;
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

export interface ProjectScheduleItem {
  id: number;
  layout_id?: number | null;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  day_of_weeks: string;
  is_interrupt: boolean;
}

export interface MediaScheduleItem {
  id: number;
  name: string;
  type: string;
  duration_sec: number;
  start_date: string;
  end_date: string;
  file_name: string;
}

export interface TodaySchedule {
  date: string;
  project_ids: number[];
}

export interface ScheduleMediaResponse {
  device_id: string;
  projects: ProjectScheduleItem[];
  media: MediaScheduleItem[];
  today_schedule?: TodaySchedule | null;
  mock?: boolean;
  error?: string;
}
