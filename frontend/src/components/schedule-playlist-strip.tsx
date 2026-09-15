import { useState } from 'react';
import {
  formatDateRange,
  formatMediaType,
} from '../lib/format-schedule';
import type { MediaScheduleItem } from '../types/api-types';

interface SchedulePlaylistStripProps {
  media: MediaScheduleItem[];
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

export function SchedulePlaylistStrip({ media }: SchedulePlaylistStripProps) {
  const [tableOpen, setTableOpen] = useState(false);

  const totalDuration = media.reduce((sum, item) => sum + item.duration_sec, 0);

  return (
    <section className="panel schedule-playlist">
      <div className="schedule-playlist__header">
        <h2>素材序列條</h2>
        <p className="schedule-playlist__meta">
          {media.length} 項 · 總播放 {totalDuration} 秒
        </p>
      </div>

      {media.length === 0 ? (
        <p className="schedule-empty">此裝置尚無素材資料。</p>
      ) : (
        <>
          <ol className="schedule-playlist__strip">
            {media.map((item, index) => (
              <li key={item.id} className="schedule-chip">
                <span className="schedule-chip__order">{index + 1}</span>
                <span className={`schedule-chip__badge ${mediaTypeClass(item.type)}`}>
                  {formatMediaType(item.type)}
                </span>
                <span className="schedule-chip__name" title={item.name}>
                  {item.name || '—'}
                </span>
                <span className="schedule-chip__duration">{item.duration_sec}s</span>
              </li>
            ))}
          </ol>

          <div className="schedule-playlist__details">
            <button
              type="button"
              className="btn btn--ghost schedule-playlist__toggle"
              onClick={() => setTableOpen((open) => !open)}
              aria-expanded={tableOpen}
            >
              {tableOpen ? '收起完整欄位' : '展開完整欄位'}
            </button>

            {tableOpen ? (
              <div className="schedule-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>名稱</th>
                      <th>類型</th>
                      <th>播放秒數</th>
                      <th>起迄日期</th>
                      <th>檔名</th>
                    </tr>
                  </thead>
                  <tbody>
                    {media.map((item) => (
                      <tr key={item.id}>
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
