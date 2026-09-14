export function formatDeviceField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return '-';
  }

  return String(value);
}
