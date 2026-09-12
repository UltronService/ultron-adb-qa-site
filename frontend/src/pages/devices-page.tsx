import { useState } from 'react';
import { MOCK_DEVICES } from '../data/mock-devices';

export function DevicesPage() {
  const [ipInput, setIpInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleDevice = (deviceId: string) => {
    setSelectedIds((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId],
    );
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>Device Dashboard</h1>
          <p>Manage set-top boxes, scan LAN, and monitor connection status.</p>
        </div>
        <div className="toolbar">
          <input
            className="input"
            placeholder="192.168.1.x:5555"
            value={ipInput}
            onChange={(event) => setIpInput(event.target.value)}
          />
          <button type="button" className="btn btn--secondary">
            Add Device
          </button>
          <button type="button" className="btn btn--primary">
            Scan LAN
          </button>
        </div>
      </header>

      <div className="device-grid">
        {MOCK_DEVICES.map((device) => (
          <article key={device.id} className="device-card">
            <div className="device-card__top">
              <label className="checkbox-row">
                <input
                  checked={selectedIds.includes(device.id)}
                  type="checkbox"
                  onChange={() => toggleDevice(device.id)}
                />
                <span className={`status-dot ${device.online ? 'status-dot--online' : 'status-dot--offline'}`} />
                <strong>{device.label}</strong>
              </label>
              <span className="badge">{device.online ? 'Online' : 'Offline'}</span>
            </div>
            <dl className="meta-list">
              <div><dt>IP</dt><dd>{device.ip}</dd></div>
              <div><dt>Model</dt><dd>{device.model}</dd></div>
              <div><dt>Android</dt><dd>{device.androidVersion}</dd></div>
              <div><dt>CPU</dt><dd>{device.online ? `${device.cpuPercent}%` : '-'}</dd></div>
              <div><dt>RAM</dt><dd>{device.online ? `${device.ramPercent}%` : '-'}</dd></div>
              <div><dt>Ping</dt><dd>{device.online ? `${device.pingMs} ms` : '-'}</dd></div>
            </dl>
            <div className="device-card__actions">
              <button type="button" className="btn btn--ghost" disabled={!device.online}>
                Open Console
              </button>
              <button type="button" className="btn btn--ghost" disabled={!device.online}>
                Screenshot
              </button>
            </div>
          </article>
        ))}
      </div>

      <footer className="page-footer">
        Selected: {selectedIds.length} device(s)
      </footer>
    </section>
  );
}
