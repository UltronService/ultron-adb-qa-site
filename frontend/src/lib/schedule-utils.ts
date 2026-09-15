import type { ProjectScheduleItem, TodaySchedule } from '../types/api-types';

const MINUTES_PER_DAY = 24 * 60;

export function parseTimeToMinutes(time: string): number {
  const parts = time.trim().split(':');
  if (parts.length < 2) {
    return 0;
  }

  const hours = Number.parseInt(parts[0], 10) || 0;
  const minutes = Number.parseInt(parts[1], 10) || 0;
  const seconds = parts.length >= 3 ? Number.parseInt(parts[2], 10) || 0 : 0;
  return hours * 60 + minutes + seconds / 60;
}

export function timeToPercent(time: string): number {
  const minutes = parseTimeToMinutes(time);
  return Math.min(100, Math.max(0, (minutes / MINUTES_PER_DAY) * 100));
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekdayCode(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  const jsDay = date.getDay();
  return String(jsDay === 0 ? 7 : jsDay);
}

export function getViewDate(todaySchedule?: TodaySchedule | null): string {
  if (todaySchedule?.date) {
    return todaySchedule.date;
  }
  return formatLocalDate(new Date());
}

export function isProjectActiveOnDate(
  project: ProjectScheduleItem,
  dateStr: string,
  projectIds?: number[],
): boolean {
  if (project.start_date && dateStr < project.start_date) {
    return false;
  }
  if (project.end_date && dateStr > project.end_date) {
    return false;
  }

  const weekday = getWeekdayCode(dateStr);
  const days = project.day_of_weeks
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
  if (days.length > 0 && !days.includes(weekday)) {
    return false;
  }

  if (projectIds && projectIds.length > 0 && !projectIds.includes(project.id)) {
    return false;
  }

  return true;
}

export function filterActiveProjects(
  projects: ProjectScheduleItem[],
  dateStr: string,
  projectIds?: number[],
): ProjectScheduleItem[] {
  return projects.filter((project) => isProjectActiveOnDate(project, dateStr, projectIds));
}

export function getNowPercent(): number {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  return (minutes / MINUTES_PER_DAY) * 100;
}

export function isToday(dateStr: string): boolean {
  return dateStr === formatLocalDate(new Date());
}

export const GANTT_HOUR_MARKS = Array.from({ length: 25 }, (_, index) => index);
