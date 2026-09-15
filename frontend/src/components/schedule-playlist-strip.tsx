import { useState } from 'react';
import {
  formatDateRange,
  formatMediaType,
  formatProjectLabel,
} from '../lib/format-schedule';
import type { ProjectMediaGroup } from '../types/api-types';

interface SchedulePlaylistStripProps {
  groups: ProjectMediaGroup[];
  selectedProjectId?: number | null;
  onClearSelection?: () => void;
}

function mediaTypeClass(type: string): string {
  const normalized = type.trim().toLowerCase();
  if (normalized === 'video') {
    return 'schedule-chip__badge--video';
  }
  if (normalized === 'image') {
    return 'schedule-chip__badge--image';
  }
  if (normalized === 'web') {
    return 'schedule-chip__badge--web';
  }
  return '';
}

function projectGroupId(projectId: number): string {
  return `schedule-project-group-${projectId}`;
}

export function SchedulePlaylistStrip({
  groups,
  selectedProjectId,
  onClearSelection,
}: SchedulePlaylistStripProps) {
  const [tableOpen, setTableOpen] = useState(false);

  const totalMedia = groups.reduce((sum, group) => sum + group.media.length, 0);
  const totalDuration = groups.reduce(
    (sum, group) => sum + group.media.reduce((groupSum, item) => groupSum + item.duration_sec, 0),
    0,
  );
  return (
    <section className="panel schedule-playlist">
      <div className="schedule-playlist__header">
        <div>
          <h2>素材清單</h2>
          {selectedProjectId ? (
            <p className="schedule-playlist__filter">
              已選取專案時段，下方已捲動至對應分組。
            </p>
          ) : (
            <p className="schedule-playlist__filter">依專案時段分組顯示素材</p>
          )}
          <p className="schedule-playlist__meta">
            {groups.length} 個專案 · {totalMedia} 項素材 · 總播放 {totalDuration} 秒
          </p>
        </div>
        {selectedProjectId && onClearSelection ? (
          <button type="button" className="btn btn--ghost schedule-playlist__clear" onClick={onClearSelection}>
            取消選取
          </button>
        ) : null}
      </div>

      {groups.length === 0 ? (
        <p className="schedule-empty">此日尚無專案素材資料。</p>
      ) : (
        <>
          <div className="schedule-media-groups">
            {groups.map((group) => {
              const isSelected = selectedProjectId === group.project.id;
              return (
                <section
                  key={group.project.id}
                  id={projectGroupId(group.project.id)}
                  className={`schedule-media-group${isSelected ? ' schedule-media-group--selected' : ''}`}
                >
                  <header className="schedule-media-group__header">
                    <h3 className="schedule-media-group__title">{formatProjectLabel(group.project)}</h3>
                    {group.project.is_interrupt ? (
                      <span className="schedule-gantt__interrupt-badge">插播</span>
                    ) : null}
                    <span className="schedule-media-group__count">{group.media.length} 項</span>
                  </header>

                  {group.media.length === 0 ? (
                    <p className="schedule-empty schedule-media-group__empty">此專案尚無素材資料。</p>
                  ) : (
                    <div className="schedule-media-cards">
                      {group.media.map((item, index) => (
                        <article key={item.id} className="schedule-media-card">
                          <div className="schedule-media-card__head">
                            <span className="schedule-media-card__order">{index + 1}</span>
                            <span className={`schedule-chip__badge ${mediaTypeClass(item.type)}`}>
                              {formatMediaType(item.type)}
                            </span>
                            <span className="schedule-media-card__duration">{item.duration_sec} 秒</span>
                          </div>
                          <h4 className="schedule-media-card__name">{item.name || '—'}</h4>
                          <p className="schedule-media-card__date">
                            {formatDateRange(item.start_date, item.end_date)}
                          </p>
                          {item.file_name ? (
                            <details className="schedule-media-card__file">
                              <summary>細節</summary>
                              <span className="schedule-media-card__filename">{item.file_name}</span>
                            </details>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <div className="schedule-playlist__details">
            <button
              type="button"
              className="btn btn--ghost schedule-playlist__toggle"
              onClick={() => setTableOpen((open) => !open)}
              aria-expanded={tableOpen}
            >
              {tableOpen ? '收起完整表格' : '展開完整表格（進階）'}
            </button>

            {tableOpen ? (
              <div className="schedule-table-wrap">
                <table className="data-table schedule-table--compact">
                  <thead>
                    <tr>
                      <th>專案</th>
                      <th>順序</th>
                      <th>名稱</th>
                      <th>類型</th>
                      <th>秒數</th>
                      <th>日期</th>
                      <th>檔名</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.flatMap((group) =>
                      group.media.map((item, index) => (
                        <tr key={`${group.project.id}-${item.id}`}>
                          <td>{formatProjectLabel(group.project)}</td>
                          <td>{index + 1}</td>
                          <td>{item.name || '—'}</td>
                          <td>{formatMediaType(item.type)}</td>
                          <td>{item.duration_sec}</td>
                          <td>{formatDateRange(item.start_date, item.end_date)}</td>
                          <td className="schedule-file-cell">{item.file_name || '—'}</td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
