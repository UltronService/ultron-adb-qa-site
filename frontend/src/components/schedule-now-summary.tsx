import { useMemo } from 'react';
import {
  formatNowClock,
  formatProjectLabel,
  formatTimeShort,
} from '../lib/format-schedule';
import {
  filterActiveProjects,
  findCurrentProject,
  findNextProject,
  getViewDate,
  isToday,
} from '../lib/schedule-utils';
import type { ProjectScheduleItem, TodaySchedule } from '../types/api-types';

interface ScheduleNowSummaryProps {
  projects: ProjectScheduleItem[];
  todaySchedule?: TodaySchedule | null;
}

export function ScheduleNowSummary({ projects, todaySchedule }: ScheduleNowSummaryProps) {
  const viewDate = getViewDate(todaySchedule);
  const projectIds = todaySchedule?.project_ids;
  const activeProjects = useMemo(
    () => filterActiveProjects(projects, viewDate, projectIds),
    [projects, viewDate, projectIds],
  );

  const nowClock = formatNowClock();
  const currentProject = isToday(viewDate) ? findCurrentProject(activeProjects) : null;
  const nextProject = isToday(viewDate) ? findNextProject(activeProjects) : null;

  let currentLine = '目前沒有任何專案在播放。';
  if (!isToday(viewDate)) {
    currentLine = `查看日期 ${viewDate}，無法判斷現在播放狀態。`;
  } else if (currentProject) {
    currentLine = `現在（約 ${nowClock}）：${formatProjectLabel(currentProject)} 播放中`;
  }

  let nextLine = '今日已無下一檔排程。';
  if (!isToday(viewDate)) {
    nextLine = '';
  } else if (nextProject) {
    nextLine = `下一檔：${formatTimeShort(nextProject.start_time)} 換成 ${formatProjectLabel(nextProject)}`;
  }

  return (
    <section className="panel schedule-now-summary" aria-label="現在播什麼">
      <h2 className="schedule-now-summary__title">現在播什麼</h2>
      <p className="schedule-now-summary__current">{currentLine}</p>
      {nextLine ? <p className="schedule-now-summary__next">{nextLine}</p> : null}
    </section>
  );
}
