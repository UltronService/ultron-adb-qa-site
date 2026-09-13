import { useEffect, useMemo, useState } from 'react';
import {
  captureScreenshot,
  exportLogcat,
  getMockLogcatLines,
  openLogcatStream,
  sendKeyEvent,
  sendTextInput,
} from '../api/console-api';
import { Modal } from '../components/ui/modal';
import { MOCK_SCREENSHOT_DATA_URL } from '../data/mock-screenshot';
import { ULTRON_PLAYER_APK_SOURCE } from '../data/ultron-player-apk';
import { fetchDevices } from '../api/device-api';
import { useDemoMode } from '../hooks/use-demo-mode';
import { useToast } from '../hooks/use-toast';
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
  const { isDemoMode } = useDemoMode();
  const { showToast } = useToast();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [textInput, setTextInput] = useState('');
  const [logLevel, setLogLevel] = useState<(typeof LOG_LEVELS)[number]>('Info');
  const [logFilter, setLogFilter] = useState('');
  const [packageFilter, setPackageFilter] = useState<string>(ULTRON_PLAYER_APK_SOURCE.packageName);
  const [logs, setLogs] = useState<string[]>([]);
  const [exportStatus, setExportStatus] = useState('');
  const [previewUrl, setPreviewUrl] = useState(MOCK_SCREENSHOT_DATA_URL);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchDevices();
        setDevices(result.filter((device) => device.online));
      } catch {
        setError('Unable to load devices');
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

    if (isDemoMode) {
      setLogs(getMockLogcatLines());
      let index = 0;
      const timer = window.setInterval(() => {
        const line = getMockLogcatLines()[index % getMockLogcatLines().length];
        setLogs((prev) => [...prev.slice(-199), `[${new Date().toISOString().slice(11, 19)}] ${line}`]);
        index += 1;
      }, 1800);
      return () => window.clearInterval(timer);
    }

    let socket: WebSocket | null = null;
    try {
      socket = openLogcatStream(selectedDevice, {
        packageName: packageFilter,
        level: logLevel,
      });
      socket.onmessage = (event) => {
        setLogs((prev) => [...prev.slice(-199), event.data as string]);
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
  }, [selectedDevice, packageFilter, logLevel, isDemoMode]);

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
      setExportStatus(`Exported ${result.line_count} lines${result.mock === 'true' ? ' (demo)' : ''}`);
      showToast('Log 已匯出', 'success');
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'Log export failed', 'error');
    }
  };

  const filteredLogs = useMemo(
    () =>
      logs.filter((line) => {
        if (logFilter && !line.toLowerCase().includes(logFilter.toLowerCase())) {
          return false;
        }
        if (logLevel !== 'Verbose' && !line.includes(`[${logLevel}]`)) {
          return logLevel === 'Info'
            ? line.includes('[Info]') || line.includes('[Warn]') || line.includes('[Error]')
            : line.includes(`[${logLevel}]`);
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
      showToast(`已送出遙控鍵：${key.toUpperCase()}${isDemoMode ? '（demo）' : ''}`, 'info');
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'Key event failed', 'error');
    }
  };

  const handleSendText = async () => {
    if (!selectedDevice || !textInput.trim()) {
      return;
    }
    try {
      await sendTextInput(selectedDevice, textInput.trim());
      setTextInput('');
      showToast('文字已送出', 'success');
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'Text input failed', 'error');
    }
  };

  const handleCapture = async () => {
    if (!selectedDevice) {
      return;
    }
    try {
      const result = await captureScreenshot(selectedDevice);
      if (result.image_base64) {
        const mime = result.mock === 'true' ? 'image/svg+xml' : 'image/png';
        setPreviewUrl(`data:${mime};base64,${result.image_base64}`);
      } else {
        setPreviewUrl(MOCK_SCREENSHOT_DATA_URL);
      }
      showToast('截圖已更新', 'success');
    } catch (requestError) {
      setPreviewUrl(MOCK_SCREENSHOT_DATA_URL);
      showToast(requestError instanceof Error ? requestError.message : 'Screenshot failed', 'error');
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
          <div className="preview-box preview-box--live">
            <button type="button" className="preview-box__image-btn" onClick={() => setPreviewOpen(true)}>
              <img alt="Device screenshot" src={previewUrl} className="preview-box__image" />
            </button>
            <div className="toolbar">
              <button type="button" className="btn btn--secondary" onClick={() => void handleCapture()}>
                Capture now
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setPreviewOpen(true)}>
                全螢幕
              </button>
            </div>
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

      <Modal open={previewOpen} title="Live Preview" onClose={() => setPreviewOpen(false)}>
        <img alt="Fullscreen preview" src={previewUrl} className="preview-modal-image" />
      </Modal>
    </section>
  );
}
