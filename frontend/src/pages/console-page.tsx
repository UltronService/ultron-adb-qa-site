import { useState } from 'react';
import { MOCK_DEVICES } from '../data/mock-devices';

const LOG_LEVELS = ['Verbose', 'Debug', 'Info', 'Warn', 'Error'] as const;

const MOCK_LOGS = [
  '[Info] App launch: com.example.tvapp/.MainActivity',
  '[Debug] Player buffer ready, duration=120000ms',
  '[Warn] Network latency spike: 280ms',
  '[Error] Login timeout on auth endpoint',
  '[Info] ADB key event: KEYCODE_DPAD_CENTER',
];

export function ConsolePage() {
  const [selectedDevice, setSelectedDevice] = useState(MOCK_DEVICES[0]?.id ?? '');
  const [textInput, setTextInput] = useState('');
  const [logLevel, setLogLevel] = useState<(typeof LOG_LEVELS)[number]>('Info');
  const [logFilter, setLogFilter] = useState('');

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Interactive Console</h1>
          <p>Remote control, live preview, logcat, and quick ADB actions.</p>
        </div>
        <select
          className="select"
          value={selectedDevice}
          onChange={(event) => setSelectedDevice(event.target.value)}
        >
          {MOCK_DEVICES.filter((d) => d.online).map((device) => (
            <option key={device.id} value={device.id}>
              {device.label} ({device.ip})
            </option>
          ))}
        </select>
      </header>

      <div className="console-grid">
        <aside className="panel">
          <h2>Virtual Remote</h2>
          <div className="remote-pad">
            <button type="button" className="remote-btn">▲</button>
            <div className="remote-row">
              <button type="button" className="remote-btn">◀</button>
              <button type="button" className="remote-btn remote-btn--ok">OK</button>
              <button type="button" className="remote-btn">▶</button>
            </div>
            <button type="button" className="remote-btn">▼</button>
          </div>
          <div className="remote-row remote-row--wrap">
            <button type="button" className="remote-btn">Back</button>
            <button type="button" className="remote-btn">Home</button>
            <button type="button" className="remote-btn">Menu</button>
            <button type="button" className="remote-btn">Vol-</button>
            <button type="button" className="remote-btn">Vol+</button>
            <button type="button" className="remote-btn">Power</button>
          </div>
          <div className="field-group">
            <label htmlFor="adb-text">Send text</label>
            <div className="inline-field">
              <input
                id="adb-text"
                className="input"
                value={textInput}
                onChange={(event) => setTextInput(event.target.value)}
                placeholder="Type text for focused input"
              />
              <button type="button" className="btn btn--primary">Send</button>
            </div>
          </div>
        </aside>

        <section className="panel panel--preview">
          <h2>Live Preview</h2>
          <div className="preview-box">
            <span>Screenshot / mirror preview</span>
            <button type="button" className="btn btn--secondary">Capture now</button>
          </div>
        </section>

        <aside className="panel panel--log">
          <div className="panel-header-row">
            <h2>Logcat</h2>
            <div className="toolbar toolbar--compact">
              <select
                className="select"
                value={logLevel}
                onChange={(event) => setLogLevel(event.target.value as (typeof LOG_LEVELS)[number])}
              >
                {LOG_LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <input
                className="input input--compact"
                placeholder="Filter keyword"
                value={logFilter}
                onChange={(event) => setLogFilter(event.target.value)}
              />
              <button type="button" className="btn btn--ghost">Pause</button>
              <button type="button" className="btn btn--ghost">Clear</button>
              <button type="button" className="btn btn--ghost">Download</button>
            </div>
          </div>
          <pre className="log-view">
            {MOCK_LOGS.filter((line) =>
              logFilter ? line.toLowerCase().includes(logFilter.toLowerCase()) : true,
            ).join('\n')}
          </pre>
        </aside>
      </div>

      <div className="quick-actions">
        <button type="button" className="btn btn--secondary">Clear App Cache</button>
        <button type="button" className="btn btn--secondary">Force Stop App</button>
        <button type="button" className="btn btn--secondary">Open Settings</button>
        <button type="button" className="btn btn--danger">Reboot Device</button>
      </div>
    </section>
  );
}
