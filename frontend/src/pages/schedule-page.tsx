import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchDevices } from '../api/device-api';
import { fetchScheduleMedia } from '../api/schedule-api';
import { Skeleton } from '../components/ui/skeleton';
import { useDemoMode } from '../hooks/use-demo-mode';
import {
  formatDateRange,
  formatDayOfWeeks,
  formatMediaType,
  formatTimeRange,
} from '../lib/format-schedule';
import type { DeviceInfo, ScheduleMediaResponse } from '../types/api-types';

export function SchedulePage() {
  const { isDemoMode } = useDemoMode();
  const [searchParams, setSearchParams] = useSearchParams();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleMediaResponse | null>(null);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [error, setError] = useState('');

  const selectedDeviceId = searchParams.get('device') ?? '';

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId) ?? null,
    [devices, selectedDeviceId],
  );

  const loadDevices = useCallback(async () => {
    setLoadingDevices(true);
    try {
      const result = await fetchDevices();
      setDevices(result);
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  const loadSchedule = useCallback(async (deviceId: string) => {
    if (!deviceId) {
      setScheduleData(null);
      setError('');
      return;
    }

    setLoadingSchedule(true);
    setError('');
    try {
      const result = await fetchScheduleMedia(deviceId);
      setScheduleData(result);
    } catch (requestError) {
      setScheduleData(null);
      setError(requestError instanceof Error ? requestError.message : '無法載入排程資料');
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    void loadSchedule(selectedDeviceId);
  }, [loadSchedule, selectedDeviceId]);

  const handleDeviceChange = (deviceId: string) => {
    if (!deviceId) {
      setSearchParams({});
      return;
    }
    setSearchParams({ device: deviceId });
  };

  const onlineDevices = devices.filter((device) => device.online);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>排程／素材</h1>
          <p>查看機上盒的專案播放時段與素材清單。</p>
        </div>
        <div className="toolbar">
          {selectedDeviceId ? (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => void loadSchedule(selectedDeviceId)}
              disabled={loadingSchedule}
            >
              {loadingSchedule ? '重新載入中…' : '重新載入'}
            </button>
          ) : null}
        </div>
      </header>

      <div className="schedule-hint panel">
        <strong>說明：</strong>
        素材只有日期與播放秒數；幾點到幾點由專案時段決定。
      </div>

      {!selectedDeviceId ? (
        <section className="panel schedule-picker">
          <h2>選擇裝置</h2>
          <p className="schedule-picker__lead">請先選一台機上盒，才能查看排程與素材。</p>
          {loadingDevices ? <Skeleton lines={3} /> : null}
          <div className="device-grid">
            {onlineDevices.map((device) => (
              <article key={device.id} className="device-card">
                <div className="device-card__top">
                  <strong>{device.label}</strong>
                  <span className="badge">線上</span>
                </div>
                <p className="schedule-picker__meta">{device.ip}</p>
                <p className="schedule-picker__meta">
                  {device.branch_name || device.model || '未命名裝置'}
                </p>
                <div className="device-card__actions">
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => handleDeviceChange(device.id)}
                  >
                    查看排程／素材
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!loadingDevices && onlineDevices.length === 0 ? (
            <p className="schedule-empty">
              目前沒有線上裝置。請先到
              <Link to="/devices"> 裝置 </Link>
              頁面連線。
            </p>
          ) : null}
        </section>
      ) : (
        <>
          <section className="panel schedule-device-bar">
            <div className="schedule-device-bar__info">
              <h2>{selectedDevice?.label ?? selectedDeviceId}</h2>
              <p>
                {selectedDevice?.ip ?? selectedDeviceId}
                {selectedDevice?.branch_name ? ` · ${selectedDevice.branch_name}` : ''}
              </p>
            </div>
            <div className="toolbar">
              <select
                className="select"
                value={selectedDeviceId}
                onChange={(event) => handleDeviceChange(event.target.value)}
              >
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.label} ({device.online ? '線上' : '離線'})
                  </option>
                ))}
              </select>
              <Link className="btn btn--ghost" to="/devices">回到裝置</Link>
            </div>
          </section>

          {loadingSchedule ? <Skeleton lines={5} /> : null}
          {error ? <div className="schedule-error panel">{error}</div> : null}

          {scheduleData && !loadingSchedule ? (
            <>
              {scheduleData.mock || isDemoMode ? (
                <p className="schedule-mock-note">目前為展示模式資料（Agent 離線或裝置無法讀取時使用）。</p>
              ) : null}

              {scheduleData.today_schedule ? (
                <section className="panel schedule-today">
                  <h3>今日排程</h3>
                  <p>
                    日期 {scheduleData.today_schedule.date}，專案 ID：
                    {scheduleData.today_schedule.project_ids.length > 0
                      ? scheduleData.today_schedule.project_ids.join('、')
                      : '（無）'}
                  </p>
                </section>
              ) : null}

              <section className="panel">
                <h2>專案時段</h2>
                {scheduleData.projects.length === 0 ? (
                  <p className="schedule-empty">此裝置尚無專案時段資料。</p>
                ) : (
                  <div className="schedule-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>版面</th>
                          <th>起迄日期</th>
                          <th>起迄時間</th>
                          <th>星期</th>
                          <th>插播</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduleData.projects.map((project) => (
                          <tr key={project.id}>
                            <td>{project.id}</td>
                            <td>{project.layout_id ?? '—'}</td>
                            <td>{formatDateRange(project.start_date, project.end_date)}</td>
                            <td>{formatTimeRange(project.start_time, project.end_time)}</td>
                            <td>{formatDayOfWeeks(project.day_of_weeks)}</td>
                            <td>{project.is_interrupt ? '是' : '否'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="panel">
                <h2>素材清單</h2>
                {scheduleData.media.length === 0 ? (
                  <p className="schedule-empty">此裝置尚無素材資料。</p>
                ) : (
                  <div className="schedule-table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>名稱</th>
                          <th>類型</th>
                          <th>播放秒數</th>
                          <th>起迄日期</th>
                          <th>檔名</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduleData.media.map((mediaItem) => (
                          <tr key={mediaItem.id}>
                            <td>{mediaItem.id}</td>
                            <td>{mediaItem.name || '—'}</td>
                            <td>{formatMediaType(mediaItem.type)}</td>
                            <td>{mediaItem.duration_sec}</td>
                            <td>{formatDateRange(mediaItem.start_date, mediaItem.end_date)}</td>
                            <td className="schedule-file-cell">{mediaItem.file_name || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
