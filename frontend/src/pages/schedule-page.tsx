import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchDevices } from '../api/device-api';
import { fetchScheduleMedia } from '../api/schedule-api';
import { ScheduleGantt } from '../components/schedule-gantt';
import { ScheduleNowSummary } from '../components/schedule-now-summary';
import { SchedulePlaylistStrip } from '../components/schedule-playlist-strip';
import { Skeleton } from '../components/ui/skeleton';
import { useDemoMode } from '../hooks/use-demo-mode';
import {
  buildProjectMediaGroups,
  filterActiveProjects,
  getDefaultSelectedProjectId,
  getViewDate,
} from '../lib/schedule-utils';
import type { DeviceInfo, ScheduleMediaResponse } from '../types/api-types';

export function SchedulePage() {
  const { isDemoMode } = useDemoMode();
  const [searchParams, setSearchParams] = useSearchParams();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleMediaResponse | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
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
      setSelectedProjectId(null);
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
      setSelectedProjectId(null);
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

  const activeProjects = useMemo(() => {
    if (!scheduleData) {
      return [];
    }
    const viewDate = getViewDate(scheduleData.today_schedule);
    return filterActiveProjects(
      scheduleData.projects,
      viewDate,
      scheduleData.today_schedule?.project_ids,
    );
  }, [scheduleData]);

  const defaultProjectId = useMemo(
    () => getDefaultSelectedProjectId(activeProjects),
    [activeProjects],
  );

  useEffect(() => {
    if (!scheduleData) {
      return;
    }
    setSelectedProjectId(defaultProjectId);
  }, [scheduleData?.device_id, defaultProjectId]);

  const mediaGroups = useMemo(() => {
    if (!scheduleData) {
      return [];
    }
    const viewDate = getViewDate(scheduleData.today_schedule);
    return buildProjectMediaGroups(
      scheduleData.projects,
      scheduleData.media,
      scheduleData.time_table ?? [],
      viewDate,
      scheduleData.today_schedule?.project_ids,
    );
  }, [scheduleData]);

  useEffect(() => {
    if (selectedProjectId === null) {
      return;
    }
    const target = document.getElementById(`schedule-project-group-${selectedProjectId}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedProjectId, mediaGroups]);

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
        素材只有日期與播放秒數；幾點到幾點由專案時段決定。專案名稱取自版面（layout），點選甘特圖可捲動至對應素材分組。
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

              <ScheduleNowSummary
                projects={scheduleData.projects}
                todaySchedule={scheduleData.today_schedule}
              />

              <ScheduleGantt
                projects={scheduleData.projects}
                todaySchedule={scheduleData.today_schedule}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
              />

              <SchedulePlaylistStrip
                groups={mediaGroups}
                selectedProjectId={selectedProjectId}
                onClearSelection={() => setSelectedProjectId(null)}
              />
            </>
          ) : null}
        </>
      )}
    </section>
  );
}
