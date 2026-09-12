import { useCallback, useEffect, useState } from 'react';
import {
  fetchAutomationRunStatus,
  fetchAutomationTemplates,
  startAutomationRun,
} from '../api/automation-api';
import { fetchDevices } from '../api/device-api';
import type { AutomationProgressRow, AutomationTemplate, DeviceInfo } from '../types/api-types';

export function AutomationPage() {
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [monkeyEvents, setMonkeyEvents] = useState('500');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [progress, setProgress] = useState<AutomationProgressRow[]>([]);
  const [runId, setRunId] = useState('');
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
      setError(requestError instanceof Error ? requestError.message : 'Failed to load automation data');
    }
  }, [selectedTemplate]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!runId) {
      return;
    }

    const timer = window.setInterval(async () => {
      try {
        const status = await fetchAutomationRunStatus(runId);
        setProgress(status.progress);
        if (status.state === 'completed') {
          window.clearInterval(timer);
        }
      } catch {
        window.clearInterval(timer);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [runId]);

  const toggleDevice = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId],
    );
  };

  const handleRun = async () => {
    if (!selectedTemplate || selectedDevices.length === 0) {
      return;
    }
    try {
      const status = await startAutomationRun(selectedTemplate, selectedDevices, {
        monkey_events: monkeyEvents,
        duration_minutes: durationMinutes,
      });
      setRunId(status.run_id);
      setProgress(status.progress);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Run failed');
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Test Automation</h1>
          <p>Run scripted tests across multiple set-top boxes.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => void handleRun()}>
          Run batch
        </button>
      </header>

      {error && <p className="page-footer">{error}</p>}

      <div className="automation-layout">
        <section className="panel">
          <h2>Templates</h2>
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

          <h3>Parameters</h3>
          <div className="field-grid">
            <label className="field-group">
              Monkey events
              <input
                className="input"
                value={monkeyEvents}
                onChange={(event) => setMonkeyEvents(event.target.value)}
              />
            </label>
            <label className="field-group">
              Duration (minutes)
              <input
                className="input"
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
              />
            </label>
          </div>

          <h3>Target devices</h3>
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
          <h2>Live progress</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Current step</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {progress.map((row, index) => (
                  <tr key={`${row.device_label}-${index}`}>
                    <td>{row.device_label}</td>
                    <td>{row.step}</td>
                    <td>
                      <span className={`status-pill status-pill--${row.status.toLowerCase()}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
