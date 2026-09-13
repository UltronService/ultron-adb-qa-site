import { useEffect, useMemo, useState } from 'react';
import {
  captureScreenshot,
  exportLogcat,
  openLogcatStream,
  sendKeyEvent,
  sendTextInput,
} from '../api/console-api';
import { ULTRON_PLAYER_APK_SOURCE } from '../data/ultron-player-apk';
import { fetchDevices } from '../api/device-api';
import { MOCK_DEVICES } from '../data/mock-devices';
import type { DeviceInfo } from '../types/api-types';

const LOG_LEVELS = ['Verbose', 'Debug', 'Info', 'Warn', 'Error'] as const;

const KEY_MAP: Record<string, string> = {
  up: '19',
  down: '20',
  left: '21',
  right: '22',
  ok: '23',
  back: '4',
  home: '3',
  menu: '82',
};

export function ConsolePage() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [textInput, setTextInput] = useState('');
  const [logLevel, setLogLevel] = useState<(typeof LOG_LEVELS)[number]>('Info');
  const [logFilter, setLogFilter] = useState('');
  const [packageFilter, setPackageFilter] = useState<string>(ULTRON_PLAYER_APK_SOURCE.packageName);
  const [logs, setLogs] = useState<string[]>([]);
  const [exportStatus, setExportStatus] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchDevices();
        setDevices(result.filter((device) => device.online));
      } catch {
        setDevices(
          MOCK_DEVICES.filter((device) => device.online).map((device) => ({
            id: device.id,
            label: device.label,
            ip: device.ip,
            online: device.online,
            model: device.model,
            android_version: device.androidVersion,
            cpu_percent: device.cpuPercent,
            ram_percent: device.ramPercent,
            ping_ms: device.pingMs,
          })),
        );
        setError('Agent offline — remote actions may not work.');
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!selectedDevice && devices[0]) {
      setSelectedDevice(devices[0].id);
    }
  }, [devices, selectedDevice]);

  useEffect(() => {
    if (!selectedDevice) {
      return;
    }

    let socket: WebSocket | null = null;
    try {
      socket = openLogcatStream(selectedDevice, {
        packageName: packageFilter,
        level: logLevel,
      });
      socket.onmessage = (event) => {
        setLogs((prev) => [...prev.slice(-199), event.data]);
      };
      socket.onerror = () => {
        setError('Logcat stream unavailable');
      };
    } catch {
      setError('Unable to open logcat stream');
    }

    return () => {
      socket?.close();
    };
  }, [selectedDevice, packageFilter, logLevel]);

  const handleExportLogs = async () => {
    if (!selectedDevice) {
      return;
    }
    try {
      const result = await exportLogcat(selectedDevice, packageFilter, logLevel);
      const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      URL.revokeObjectURL(url);
      setExportStatus(`Exported ${result.line_count} lines${result.mock === 'true' ? ' (mock)' : ''}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Log export failed');
    }
  };

  const filteredLogs = useMemo(
    () =>
      logs.filter((line) => {
        if (logFilter && !line.toLowerCase().includes(logFilter.toLowerCase())) {
          return false;
        }
        if (logLevel !== 'Verbose' && !line.includes(`[${logLevel}]`)) {
          return logLevel === 'Info' ? line.includes('[Info]') || line.includes('[Warn]') || line.includes('[Error]') : line.includes(`[${logLevel}]`);
        }
        return true;
      }),
    [logFilter, logLevel, logs],
  );

  const handleKey = async (key: string) => {
    if (!selectedDevice) {
      return;
    }
    try {
      await sendKeyEvent(selectedDevice, KEY_MAP[key] ?? key);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Key event failed');
    }
  };

  const handleSendText = async () => {
    if (!selectedDevice || !textInput.trim()) {
      return;
    }
    try {
      await sendTextInput(selectedDevice, textInput.trim());
      setTextInput('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Text input failed');
    }
  };

  const handleCapture = async () => {
    if (!selectedDevice) {
      return;
    }
    try {
      const result = await captureScreenshot(selectedDevice);
      if (result.image_base64) {
        setPreviewUrl(`data:image/png;base64,${result.image_base64}`);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Screenshot failed');
    }
  };

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
          {devices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.label} ({device.ip})
            </option>
          ))}
        </select>
      </header>

      {error && <p className="page-footer">{error}</p>}

      <div className="console-grid">
        <aside className="panel">
          <h2>Virtual Remote</h2>
          <div className="remote-pad">
            <button type="button" className="remote-btn" onClick={() => void handleKey('up')}>▲</button>
            <div className="remote-row">
              <button type="button" className="remote-btn" onClick={() => void handleKey('left')}>◀</button>
              <button type="button" className="remote-btn remote-btn--ok" onClick={() => void handleKey('ok')}>OK</button>
              <button type="button" className="remote-btn" onClick={() => void handleKey('right')}>▶</button>
            </div>
            <button type="button" className="remote-btn" onClick={() => void handleKey('down')}>▼</button>
          </div>
          <div className="remote-row remote-row--wrap">
            <button type="button" className="remote-btn" onClick={() => void handleKey('back')}>Back</button>
            <button type="button" className="remote-btn" onClick={() => void handleKey('home')}>Home</button>
            <button type="button" className="remote-btn" onClick={() => void handleKey('menu')}>Menu</button>
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
              <button type="button" className="btn btn--primary" onClick={() => void handleSendText()}>
                Send
              </button>
            </div>
          </div>
        </aside>

        <section className="panel panel--preview">
          <h2>Live Preview</h2>
          <div className="preview-box">
            {previewUrl ? (
              <img alt="Device screenshot" src={previewUrl} style={{ maxWidth: '100%' }} />
            ) : (
              <span>Screenshot / mirror preview</span>
            )}
            <button type="button" className="btn btn--secondary" onClick={() => void handleCapture()}>
              Capture now
            </button>
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
                placeholder="Package"
                value={packageFilter}
                onChange={(event) => setPackageFilter(event.target.value)}
              />
              <input
                className="input input--compact"
                placeholder="Filter keyword"
                value={logFilter}
                onChange={(event) => setLogFilter(event.target.value)}
              />
              <button type="button" className="btn btn--ghost" onClick={() => setLogs([])}>Clear</button>
              <button type="button" className="btn btn--secondary" onClick={() => void handleExportLogs()}>
                Export .log
              </button>
            </div>
          </div>
          {exportStatus && <p className="page-footer">{exportStatus}</p>}
          <pre className="log-view">{filteredLogs.join('\n')}</pre>
        </aside>
      </div>
    </section>
  );
}
