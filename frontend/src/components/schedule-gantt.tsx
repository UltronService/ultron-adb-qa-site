import { useMemo } from 'react';
import {
  formatDateRange,
  formatDayOfWeeks,
  formatProjectRowLabel,
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
  selectedProjectId?: number | null;
  onSelectProject?: (projectId: number) => void;
}

function buildBarStyle(project: ProjectScheduleItem): { left: string; width: string } {
  const left = timeToPercent(project.start_time);
  const right = timeToPercent(project.end_time);
  const width = Math.max(0.5, right - left);
  return { left: `${left}%`, width: `${width}%` };
}

export function ScheduleGantt({
  projects,
  todaySchedule,
  selectedProjectId,
  onSelectProject,
}: ScheduleGanttProps) {
  const viewDate = getViewDate(todaySchedule);
  const projectIds = todaySchedule?.project_ids;

  const activeProjects = useMemo(
    () => filterActiveProjects(projects, viewDate, projectIds),
    [projects, viewDate, projectIds],
  );

  const showNowLine = isToday(viewDate);
  const nowPercent = showNowLine ? getNowPercent() : 0;

  const handleSelect = (projectId: number) => {
    onSelectProject?.(projectId);
  };

  return (
    <section className="panel schedule-gantt">
      <div className="schedule-gantt__header">
        <h2>今日甘特圖</h2>
        <p className="schedule-gantt__subtitle">
          {viewDate}
          {onSelectProject ? ' · 點選時段可查看對應素材' : ''}
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
              const rowLabel = formatProjectRowLabel(project);
              const tooltip = [
                formatDateRange(project.start_date, project.end_date),
                formatDayOfWeeks(project.day_of_weeks),
                project.is_interrupt ? '插播' : '一般',
                formatTimeRange(project.start_time, project.end_time),
              ].join(' · ');
              const isSelected = selectedProjectId === project.id;

              return (
                <div
                  key={project.id}
                  className={`schedule-gantt__row${isSelected ? ' schedule-gantt__row--selected' : ''}`}
                >
                  <button
                    type="button"
                    className="schedule-gantt__label"
                    title={tooltip}
                    onClick={() => handleSelect(project.id)}
                    aria-pressed={isSelected}
                  >
                    <span className="schedule-gantt__label-text">{rowLabel}</span>
                    {project.is_interrupt ? (
                      <span className="schedule-gantt__interrupt-badge">插播</span>
                    ) : null}
                  </button>
                  <div className="schedule-gantt__track">
                    {showNowLine ? (
                      <div
                        className="schedule-gantt__now-line"
                        style={{ left: `${nowPercent}%` }}
                        title="現在"
                        aria-hidden="true"
                      />
                    ) : null}
                    <button
                      type="button"
                      className={`schedule-gantt__bar${project.is_interrupt ? ' schedule-gantt__bar--interrupt' : ''}${isSelected ? ' schedule-gantt__bar--selected' : ''}`}
                      style={barStyle}
                      title={tooltip}
                      onClick={() => handleSelect(project.id)}
                      aria-pressed={isSelected}
                    >
                      <span className="schedule-gantt__bar-time">
                        {formatTimeRange(project.start_time, project.end_time)}
                      </span>
                    </button>
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
