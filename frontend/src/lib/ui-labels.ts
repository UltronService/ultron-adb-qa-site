export function formatRunStatus(status: string): string {
  switch (status) {
    case 'Running':
    case 'running':
      return '執行中';
    case 'Pass':
    case 'pass':
      return '通過';
    case 'Fail':
    case 'fail':
      return '失敗';
    case 'pending':
      return '等待中';
    case 'Offline':
      return '離線';
    default:
      return status;
  }
}

export function runStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'running':
      return 'running';
    case 'pass':
      return 'pass';
    case 'fail':
      return 'fail';
    case 'pending':
      return 'pending';
    default:
      return 'pending';
  }
}

export const LOG_LEVEL_OPTIONS = [
  { value: 'Verbose', label: '詳細' },
  { value: 'Debug', label: '除錯' },
  { value: 'Info', label: '資訊' },
  { value: 'Warn', label: '警告' },
  { value: 'Error', label: '錯誤' },
] as const;

export type LogLevel = (typeof LOG_LEVEL_OPTIONS)[number]['value'];
