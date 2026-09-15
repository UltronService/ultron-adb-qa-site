import { useMemo } from 'react';
import {
  formatDateRange,
  formatDayOfWeeks,
  formatTimeRange,
} from '../lib/format-schedule';
import {
  filterActiveProjects,
  GANTT_HOUR_MARKS,
  getNowPercent,
  getViewDate,
  isToday,
  timeToPercent,
} from '../lib/schedule-utils';
import type { ProjectScheduleItem, TodaySchedule } from '../types/api-types';

interface ScheduleGanttProps {
  projects: ProjectScheduleItem[];
  todaySchedule?: TodaySchedule | null;
}

function buildBarStyle(project: ProjectScheduleItem): { left: string; width: string } {
  const left = timeToPercent(project.start_time);
  const right = timeToPercent(project.end_time);
  const width = Math.max(0.5, right - left);
  return { left: `${left}%`, width: `${width}%` };
}

export function ScheduleGantt({ projects, todaySchedule }: ScheduleGanttProps) {
  const viewDate = getViewDate(todaySchedule);
  const projectIds = todaySchedule?.project_ids;

  const activeProjects = useMemo(
    () => filterActiveProjects(projects, viewDate, projectIds),
    [projects, viewDate, projectIds],
  );

  const showNowLine = isToday(viewDate);
  const nowPercent = showNowLine ? getNowPercent() : 0;

  return (
    <section className="panel schedule-gantt">
      <div className="schedule-gantt__header">
        <h2>今日甘特圖</h2>
        <p className="schedule-gantt__subtitle">
          {viewDate}
          {todaySchedule?.project_ids.length
            ? ` · 今日專案 ${todaySchedule.project_ids.join('、')}`
            : ''}
        </p>
      </div>

      {activeProjects.length === 0 ? (
        <p className="schedule-empty">此日無有效專案時段。</p>
      ) : (
        <div className="schedule-gantt__chart">
          <div className="schedule-gantt__axis" aria-hidden="true">
            {GANTT_HOUR_MARKS.map((hour) => (
              <span
                key={hour}
                className="schedule-gantt__tick"
                style={{ left: `${(hour / 24) * 100}%` }}
              >
                <span className="schedule-gantt__tick-label">{hour}</span>
              </span>
            ))}
          </div>

          <div className="schedule-gantt__rows">
            {activeProjects.map((project) => {
              const barStyle = buildBarStyle(project);
              const tooltip = [
                formatDateRange(project.start_date, project.end_date),
                formatDayOfWeeks(project.day_of_weeks),
                project.is_interrupt ? '插播' : '一般',
                formatTimeRange(project.start_time, project.end_time),
              ].join(' · ');

              return (
                <div key={project.id} className="schedule-gantt__row">
                  <div className="schedule-gantt__label" title={tooltip}>
                    <span className="schedule-gantt__label-id">#{project.id}</span>
                    {project.layout_id != null ? (
                      <span className="schedule-gantt__label-layout">L{project.layout_id}</span>
                    ) : null}
                    {project.is_interrupt ? (
                      <span className="schedule-gantt__interrupt-badge">插播</span>
                    ) : null}
                  </div>
                  <div className="schedule-gantt__track">
                    {showNowLine ? (
                      <div
                        className="schedule-gantt__now-line"
                        style={{ left: `${nowPercent}%` }}
                        title="現在"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div
                      className={`schedule-gantt__bar${project.is_interrupt ? ' schedule-gantt__bar--interrupt' : ''}`}
                      style={barStyle}
                      title={tooltip}
                    >
                      <span className="schedule-gantt__bar-time">
                        {project.start_time.slice(0, 5)}–{project.end_time.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
