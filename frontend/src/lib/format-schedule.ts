import type { ProjectScheduleItem } from '../types/api-types';

const WEEKDAY_LABELS: Record<string, string> = {
  '1': '一',
  '2': '二',
  '3': '三',
  '4': '四',
  '5': '五',
  '6': '六',
  '7': '日',
};

export function formatDayOfWeeks(raw: string): string {
  const normalized = raw.trim();
  if (!normalized) {
    return '—';
  }

  const labels = normalized
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => WEEKDAY_LABELS[token] ?? token);

  return labels.length > 0 ? `週${labels.join('、')}` : normalized;
}

export function formatMediaType(type: string): string {
  const normalized = type.trim().toLowerCase();
  if (normalized === 'video') {
    return '影片';
  }
  if (normalized === 'image') {
    return '圖片';
  }
  if (normalized === 'web') {
    return '網頁';
  }
  return type || '—';
}

export function formatTimeShort(time: string): string {
  const parts = time.trim().split(':');
  if (parts.length < 2) {
    return time.trim() || '—';
  }
  const hours = parts[0].padStart(2, '0');
  const minutes = parts[1].padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  const start = formatTimeShort(startTime);
  const end = formatTimeShort(endTime);
  if (start === '—' && end === '—') {
    return '—';
  }
  return `${start}–${end}`;
}

export function formatProjectLabel(project: ProjectScheduleItem): string {
  const timeRange = formatTimeRange(project.start_time, project.end_time);
  const idPart = `專案 ${project.id}`;
  const layoutName = project.layout_name?.trim();
  if (layoutName) {
    return `${timeRange}（${idPart}｜${layoutName}）`;
  }
  return `${timeRange}（${idPart}）`;
}

export function formatProjectRowLabel(project: ProjectScheduleItem): string {
  return formatProjectLabel(project);
}

export function formatNowClock(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = startDate.trim();
  const end = endDate.trim();
  if (!start && !end) {
    return '—';
  }
  return `${start || '—'} ~ ${end || '—'}`;
}
