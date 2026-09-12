import { useState } from 'react';
import { MOCK_DEVICES } from '../data/mock-devices';

const TEMPLATES = [
  { id: 'cold-start', name: 'Cold start time', description: 'Measure app launch to first frame.' },
  { id: 'monkey', name: 'Monkey stress', description: 'Random UI stress with configurable taps.' },
  { id: 'long-play', name: 'Long playback', description: 'Monitor playback stability over time.' },
  { id: 'reboot-net', name: 'Reboot network restore', description: 'Reboot loop and verify network recovery.' },
] as const;

type TemplateId = (typeof TEMPLATES)[number]['id'];

interface ProgressRow {
  deviceLabel: string;
  step: string;
  status: 'Running' | 'Pass' | 'Fail';
}

const MOCK_PROGRESS: ProgressRow[] = [
  { deviceLabel: 'STB-LivingRoom', step: 'Launch app', status: 'Pass' },
  { deviceLabel: 'STB-LivingRoom', step: 'Measure cold start', status: 'Running' },
  { deviceLabel: 'STB-QA-Bench', step: 'Launch app', status: 'Fail' },
];

export function AutomationPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('cold-start');
  const [monkeyEvents, setMonkeyEvents] = useState('500');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [selectedDevices, setSelectedDevices] = useState<string[]>(['stb-1', 'stb-2']);

  const toggleDevice = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId],
    );
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Test Automation</h1>
          <p>Run scripted tests across multiple set-top boxes.</p>
        </div>
        <button type="button" className="btn btn--primary">Run batch</button>
      </header>

      <div className="automation-layout">
        <section className="panel">
          <h2>Templates</h2>
          <div className="template-grid">
            {TEMPLATES.map((template) => (
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
            {MOCK_DEVICES.filter((d) => d.online).map((device) => (
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
                {MOCK_PROGRESS.map((row, index) => (
                  <tr key={`${row.deviceLabel}-${index}`}>
                    <td>{row.deviceLabel}</td>
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
