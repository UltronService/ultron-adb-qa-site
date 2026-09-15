import { Fragment, useEffect, useState } from 'react';
import {
  formatDateRange,
  formatMediaType,
  formatProjectLabel,
} from '../lib/format-schedule';
import type { ProjectMediaGroup } from '../types/api-types';

interface ScheduleMediaTableProps {
  groups: ProjectMediaGroup[];
  selectedProjectId?: number | null;
  onClearSelection?: () => void;
}

function projectGroupId(projectId: number): string {
  return `schedule-project-group-${projectId}`;
}

export function ScheduleMediaTable({
  groups,
  selectedProjectId,
  onClearSelection,
}: ScheduleMediaTableProps) {
  const [tableOpen, setTableOpen] = useState(true);
  const [pulseProjectId, setPulseProjectId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedProjectId == null) {
      return;
    }
    setPulseProjectId(selectedProjectId);
    const timer = window.setTimeout(() => {
      setPulseProjectId(null);
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId == null || !tableOpen) {
      return;
    }
    const target = document.getElementById(projectGroupId(selectedProjectId));
    if (!target) {
      return;
    }
    const container = target.closest('.schedule-detail__table-wrap');
    if (container instanceof HTMLElement) {
      const targetTop = target.offsetTop - container.offsetTop;
      container.scrollTo({ top: Math.max(0, targetTop - 4), behavior: 'smooth' });
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedProjectId, groups, tableOpen]);

  const totalMedia = groups.reduce((sum, group) => sum + group.media.length, 0);
  const totalDuration = groups.reduce(
    (sum, group) => sum + group.media.reduce((groupSum, item) => groupSum + item.duration_sec, 0),
    0,
  );

  return (
    <section className="panel schedule-detail">
      <div className="schedule-detail__header">
        <div>
          <h2>素材明細</h2>
          <p className="schedule-detail__lead">點上方甘特圖時段，下方表格會自動捲到對應專案。</p>
          <p className="schedule-detail__meta">
            {groups.length} 個專案 · {totalMedia} 項素材 · 總播放 {totalDuration} 秒
          </p>
        </div>
        {selectedProjectId && onClearSelection ? (
          <button type="button" className="btn btn--ghost schedule-detail__clear" onClick={onClearSelection}>
            取消選取
          </button>
        ) : null}
      </div>

      {groups.length === 0 ? (
        <p className="schedule-empty">此日尚無專案素材資料。</p>
      ) : (
        <>
          <div className="schedule-detail__toolbar">
            <button
              type="button"
              className="btn btn--ghost schedule-detail__toggle"
              onClick={() => setTableOpen((open) => !open)}
              aria-expanded={tableOpen}
            >
              {tableOpen ? '收起表格' : '展開表格'}
            </button>
          </div>

          {tableOpen ? (
            <div className="schedule-table-wrap schedule-detail__table-wrap">
              <table className="data-table schedule-detail-table">
                <thead className="schedule-detail-table__head">
                  <tr>
                    <th className="schedule-detail-table__col-order">順序</th>
                    <th className="schedule-detail-table__col-name">名稱</th>
                    <th className="schedule-detail-table__col-type">類型</th>
                    <th className="schedule-detail-table__col-duration">秒數</th>
                    <th className="schedule-detail-table__col-date">日期</th>
                    <th className="schedule-detail-table__col-file">檔名</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => {
                    const isSelected = selectedProjectId === group.project.id;
                    const isPulsing = pulseProjectId === group.project.id;
                    const groupRowClass = [
                      'schedule-detail-table__group-row',
                      isSelected ? 'schedule-detail-table__group-row--selected' : '',
                      isPulsing ? 'schedule-detail-table__group-row--pulse' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <Fragment key={group.project.id}>
                        <tr
                          id={projectGroupId(group.project.id)}
                          className={groupRowClass}
                        >
                          <td colSpan={6}>
                            <div className="schedule-detail-table__group-inner">
                              <span className="schedule-detail-table__group-title">
                                {formatProjectLabel(group.project)}
                              </span>
                              {group.project.is_interrupt ? (
                                <span className="schedule-gantt__interrupt-badge">插播</span>
                              ) : null}
                              <span className="schedule-detail-table__group-count">
                                {group.media.length} 項
                              </span>
                            </div>
                          </td>
                        </tr>
                        {group.media.length === 0 ? (
                          <tr
                            className={
                              isSelected ? 'schedule-detail-table__row--selected' : undefined
                            }
                          >
                            <td colSpan={6} className="schedule-detail-table__empty-cell">
                              此專案尚無素材資料。
                            </td>
                          </tr>
                        ) : (
                          group.media.map((item, index) => (
                            <tr
                              key={item.id}
                              className={
                                isSelected ? 'schedule-detail-table__row--selected' : undefined
                              }
                            >
                              <td className="schedule-detail-table__col-order">{index + 1}</td>
                              <td className="schedule-detail-table__col-name">{item.name || '—'}</td>
                              <td className="schedule-detail-table__col-type">
                                {formatMediaType(item.type)}
                              </td>
                              <td className="schedule-detail-table__col-duration">
                                {item.duration_sec}
                              </td>
                              <td className="schedule-detail-table__col-date">
                                {formatDateRange(item.start_date, item.end_date)}
                              </td>
                              <td className="schedule-detail-table__col-file schedule-file-cell">
                                {item.file_name || '—'}
                              </td>
                            </tr>
                          ))
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
