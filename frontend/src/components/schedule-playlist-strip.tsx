import { useState } from 'react';
import {
  formatDateRange,
  formatMediaType,
  formatProjectLabel,
} from '../lib/format-schedule';
import { hasProjectMediaMapping } from '../lib/schedule-utils';
import type { MediaScheduleItem, ProjectScheduleItem, TimeTableEntry } from '../types/api-types';

interface SchedulePlaylistStripProps {
  media: MediaScheduleItem[];
  projects: ProjectScheduleItem[];
  timeTable?: TimeTableEntry[];
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

export function SchedulePlaylistStrip({
  media,
  projects,
  timeTable = [],
  selectedProjectId,
  onClearSelection,
}: SchedulePlaylistStripProps) {
  const [tableOpen, setTableOpen] = useState(false);

  const selectedProject = selectedProjectId
    ? projects.find((project) => project.id === selectedProjectId) ?? null
    : null;
  const hasMapping = selectedProjectId
    ? hasProjectMediaMapping(timeTable, selectedProjectId)
    : false;

  const totalDuration = media.reduce((sum, item) => sum + item.duration_sec, 0);

  return (
    <section className="panel schedule-playlist">
      <div className="schedule-playlist__header">
        <div>
          <h2>素材清單</h2>
          {selectedProject ? (
            <p className="schedule-playlist__filter">
              目前顯示：<strong>{formatProjectLabel(selectedProject)}</strong>
              {!hasMapping ? (
                <span className="schedule-playlist__filter-note">（尚無專案對應資料，顯示全部素材）</span>
              ) : null}
            </p>
          ) : (
            <p className="schedule-playlist__filter">顯示全部素材</p>
          )}
          <p className="schedule-playlist__meta">
            {media.length} 項 · 總播放 {totalDuration} 秒
          </p>
        </div>
        {selectedProject && onClearSelection ? (
          <button type="button" className="btn btn--ghost schedule-playlist__clear" onClick={onClearSelection}>
            顯示全部
          </button>
        ) : null}
      </div>

      {media.length === 0 ? (
        <p className="schedule-empty">此專案尚無素材資料。</p>
      ) : (
        <>
          <div className="schedule-media-cards">
            {media.map((item, index) => (
              <article key={item.id} className="schedule-media-card">
                <div className="schedule-media-card__head">
                  <span className="schedule-media-card__order">{index + 1}</span>
                  <span className={`schedule-chip__badge ${mediaTypeClass(item.type)}`}>
                    {formatMediaType(item.type)}
                  </span>
                  <span className="schedule-media-card__duration">{item.duration_sec} 秒</span>
                </div>
                <h3 className="schedule-media-card__name">{item.name || '—'}</h3>
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
                      <th>順序</th>
                      <th>名稱</th>
                      <th>類型</th>
                      <th>秒數</th>
                      <th>日期</th>
                      <th>檔名</th>
                    </tr>
                  </thead>
                  <tbody>
                    {media.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>{item.name || '—'}</td>
                        <td>{formatMediaType(item.type)}</td>
                        <td>{item.duration_sec}</td>
                        <td>{formatDateRange(item.start_date, item.end_date)}</td>
                        <td className="schedule-file-cell">{item.file_name || '—'}</td>
                      </tr>
                    ))}
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
