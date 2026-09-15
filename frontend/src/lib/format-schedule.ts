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

export function formatTimeRange(startTime: string, endTime: string): string {
  const start = startTime.trim();
  const end = endTime.trim();
  if (!start && !end) {
    return '—';
  }
  return `${start || '—'} ~ ${end || '—'}`;
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = startDate.trim();
  const end = endDate.trim();
  if (!start && !end) {
    return '—';
  }
  return `${start || '—'} ~ ${end || '—'}`;
}
