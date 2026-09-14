import { useCallback, useEffect, useState } from 'react';
import {
  fetchAutomationRunStatus,
  fetchAutomationTemplates,
  isMockAutomationRun,
  startAutomationRun,
} from '../api/automation-api';
import { fetchDevices } from '../api/device-api';
import { Drawer } from '../components/ui/drawer';
import { mockAdvanceAutomationRun, mockStopAutomationRun } from '../lib/mock-api';
import { formatRunStatus, runStatusClass } from '../lib/ui-labels';
import { useToast } from '../hooks/use-toast';
import type { AutomationProgressRow, AutomationTemplate, DeviceInfo } from '../types/api-types';

export function AutomationPage() {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [monkeyEvents, setMonkeyEvents] = useState('500');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [progress, setProgress] = useState<AutomationProgressRow[]>([]);
  const [runId, setRunId] = useState('');
  const [runState, setRunState] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [error, setError] = useState('');

  const loadInitial = useCallback(async () => {
    try {
      const [templateList, deviceList] = await Promise.all([
        fetchAutomationTemplates(),
        fetchDevices(),
      ]);
      setTemplates(templateList);
      setDevices(deviceList.filter((device) => device.online));
      if (!selectedTemplate && templateList[0]) {
        setSelectedTemplate(templateList[0].id);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '無法載入自動化資料');
    }
  }, [selectedTemplate]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!runId || runState === 'completed' || runState === 'stopped') {
      return;
    }

    const timer = window.setInterval(async () => {
      try {
        if (isMockAutomationRun(runId)) {
          mockAdvanceAutomationRun(runId);
        }
        const status = await fetchAutomationRunStatus(runId);
        setProgress(status.progress);
        setRunState(status.state);
        if (status.state === 'completed' || status.state === 'stopped') {
          window.clearInterval(timer);
          showToast(status.state === 'completed' ? '批次測試完成' : '已停止', 'success');
        }
      } catch {
        window.clearInterval(timer);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [runId, runState, showToast]);

  const toggleDevice = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId],
    );
  };

  const handleRun = async () => {
    if (!selectedTemplate || selectedDevices.length === 0) {
      showToast('請選模板與至少一台裝置', 'error');
      return;
    }
    try {
      const status = await startAutomationRun(selectedTemplate, selectedDevices, {
        monkey_events: monkeyEvents,
        duration_minutes: durationMinutes,
      });
      setRunId(status.run_id);
      setRunState(status.state);
      setProgress(status.progress);
      showToast('批次測試已開始', 'info');
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : '執行失敗';
      setError(message);
      showToast(message, 'error');
    }
  };

  const handleStop = () => {
    if (!runId) {
      return;
    }
    if (isMockAutomationRun(runId)) {
      mockStopAutomationRun(runId);
    }
    setRunState('stopped');
    showToast('已停止批次測試', 'info');
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>測試自動化</h1>
          <p>選擇模板與裝置，批次執行腳本測試。</p>
        </div>
        <div className="toolbar">
          <button type="button" className="btn btn--primary" onClick={() => void handleRun()}>
            執行批次
          </button>
          {runId && runState === 'running' ? (
            <button type="button" className="btn btn--danger" onClick={handleStop}>
              停止
            </button>
          ) : null}
          {progress.length > 0 ? (
            <button type="button" className="btn btn--ghost" onClick={() => setDetailOpen(true)}>
              執行詳情
            </button>
          ) : null}
        </div>
      </header>

      {error && <p className="page-footer">{error}</p>}

      <div className="automation-layout">
        <section className="panel">
          <h2>測試模板</h2>
          <div className="template-grid">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                className={
                  selectedTemplate === template.id
                    ? 'template-card template-card--active'
                    : 'template-card'
                }
                onClick={() => setSelectedTemplate(template.id)}
              >
                <strong>{template.name}</strong>
                <span>{template.description}</span>
              </button>
            ))}
          </div>

          <h3>參數</h3>
          <div className="field-grid">
            <label className="field-group">
              Monkey 事件數
              <input
                className="input"
                value={monkeyEvents}
                onChange={(event) => setMonkeyEvents(event.target.value)}
              />
            </label>
            <label className="field-group">
              持續時間（分鐘）
              <input
                className="input"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
              />
            </label>
          </div>

          <h3>目標裝置</h3>
          <div className="device-checklist">
            {devices.map((device) => (
              <label key={device.id} className="checkbox-row">
                <input
                  checked={selectedDevices.includes(device.id)}
                  type="checkbox"
                  onChange={() => toggleDevice(device.id)}
                />
                {device.label}
              </label>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>即時進度</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>裝置</th>
                  <th>目前步驟</th>
                  <th>狀態</th>
                </tr>
              </thead>
              <tbody>
                {progress.length === 0 ? (
                  <tr>
                    <td colSpan={3}>按「執行批次」開始模擬進度</td>
                  </tr>
                ) : (
                  progress.map((row, index) => (
                    <tr key={`${row.device_label}-${index}`}>
                      <td>{row.device_label}</td>
                      <td>{row.step}</td>
                      <td>
                        <span className={`status-pill status-pill--${runStatusClass(row.status)}`}>
                          {formatRunStatus(row.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Drawer open={detailOpen} title="執行時間軸" onClose={() => setDetailOpen(false)}>
        <ul className="timeline-list">
          {progress.map((row, index) => (
            <li key={`${row.device_label}-timeline-${index}`}>
              <strong>{row.device_label}</strong>
              <span>{row.step}</span>
              <span className={`status-pill status-pill--${runStatusClass(row.status)}`}>{formatRunStatus(row.status)}</span>
            </li>
          ))}
        </ul>
      </Drawer>
    </section>
  );
}
