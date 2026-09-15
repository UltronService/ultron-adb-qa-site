import type {
  MediaScheduleItem,
  ProjectMediaGroup,
  ProjectScheduleItem,
  TimeTableEntry,
  TodaySchedule,
} from '../types/api-types';

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

export function getCurrentMinutes(date: Date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

export function isTimeWithinRange(
  minutes: number,
  startTime: string,
  endTime: string,
): boolean {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (end <= start) {
    return minutes >= start || minutes < end;
  }
  return minutes >= start && minutes < end;
}

export function compareProjectsByStartTime(
  left: ProjectScheduleItem,
  right: ProjectScheduleItem,
): number {
  const startDiff = parseTimeToMinutes(left.start_time) - parseTimeToMinutes(right.start_time);
  if (startDiff !== 0) {
    return startDiff;
  }
  if (left.is_interrupt !== right.is_interrupt) {
    return left.is_interrupt ? -1 : 1;
  }
  return left.id - right.id;
}

export function sortProjectsByStartTime(
  projects: ProjectScheduleItem[],
): ProjectScheduleItem[] {
  return [...projects].sort(compareProjectsByStartTime);
}

export function findCurrentProject(
  projects: ProjectScheduleItem[],
  nowMinutes: number = getCurrentMinutes(),
): ProjectScheduleItem | null {
  const playing = projects.filter((project) =>
    isTimeWithinRange(nowMinutes, project.start_time, project.end_time),
  );
  if (playing.length === 0) {
    return null;
  }
  const interrupts = playing.filter((project) => project.is_interrupt);
  if (interrupts.length > 0) {
    return sortProjectsByStartTime(interrupts)[0];
  }
  return sortProjectsByStartTime(playing)[0];
}

export function findNextProject(
  projects: ProjectScheduleItem[],
  nowMinutes: number = getCurrentMinutes(),
): ProjectScheduleItem | null {
  const upcoming = projects.filter(
    (project) => parseTimeToMinutes(project.start_time) > nowMinutes,
  );
  if (upcoming.length === 0) {
    return null;
  }
  return sortProjectsByStartTime(upcoming)[0];
}

export function getDefaultSelectedProjectId(
  projects: ProjectScheduleItem[],
  nowMinutes: number = getCurrentMinutes(),
): number | null {
  const current = findCurrentProject(projects, nowMinutes);
  if (current) {
    return current.id;
  }
  const sorted = sortProjectsByStartTime(projects);
  return sorted[0]?.id ?? null;
}

export function getProjectMediaIds(
  project: ProjectScheduleItem,
  timeTable: TimeTableEntry[],
): number[] {
  const fromProject = project.media_ids ?? [];
  if (fromProject.length > 0) {
    return fromProject;
  }

  return timeTable
    .filter((entry) => entry.project_id === project.id)
    .sort((left, right) => left.sequence - right.sequence)
    .map((entry) => entry.media_id);
}

export function resolveMediaForProject(
  media: MediaScheduleItem[],
  project: ProjectScheduleItem,
  timeTable: TimeTableEntry[],
): MediaScheduleItem[] {
  const mediaIds = getProjectMediaIds(project, timeTable);
  if (mediaIds.length === 0) {
    return [];
  }

  const mediaById = new Map(media.map((item) => [item.id, item]));
  return mediaIds
    .map((mediaId) => mediaById.get(mediaId))
    .filter((item): item is MediaScheduleItem => item !== undefined);
}

export function hasProjectMediaMapping(
  project: ProjectScheduleItem,
  timeTable: TimeTableEntry[],
): boolean {
  if ((project.media_ids?.length ?? 0) > 0) {
    return true;
  }
  return timeTable.some((entry) => entry.project_id === project.id);
}

export function buildProjectMediaGroups(
  projects: ProjectScheduleItem[],
  media: MediaScheduleItem[],
  timeTable: TimeTableEntry[],
  dateStr: string,
  projectIds?: number[],
): ProjectMediaGroup[] {
  const activeProjects = sortProjectsByStartTime(
    filterActiveProjects(projects, dateStr, projectIds),
  );

  const groups: ProjectMediaGroup[] = [];
  for (const project of activeProjects) {
    const groupMedia = resolveMediaForProject(media, project, timeTable);
    if (groupMedia.length === 0 && !hasProjectMediaMapping(project, timeTable)) {
      continue;
    }
    groups.push({ project, media: groupMedia });
  }

  return groups;
}
