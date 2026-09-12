import { useCallback, useEffect, useState } from 'react';
import { connectDevice, fetchDevices, scanDevices } from '../api/device-api';
import { MOCK_DEVICES } from '../data/mock-devices';
import type { DeviceInfo } from '../types/api-types';

function mapMockToApi(device: (typeof MOCK_DEVICES)[number]): DeviceInfo {
  return {
    id: device.id,
    label: device.label,
    ip: device.ip,
    online: device.online,
    model: device.model,
    android_version: device.androidVersion,
    cpu_percent: device.cpuPercent,
    ram_percent: device.ramPercent,
    ping_ms: device.pingMs,
  };
}

export function DevicesPage() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [ipInput, setIpInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingMock, setUsingMock] = useState(false);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchDevices();
      setDevices(result);
      setUsingMock(false);
    } catch {
      setDevices(MOCK_DEVICES.map(mapMockToApi));
      setUsingMock(true);
      setError('Agent 離線，顯示 mock 資料');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  const toggleDevice = (deviceId: string) => {
    setSelectedIds((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId],
    );
  };

  const handleConnect = async () => {
    if (!ipInput.trim()) {
      return;
    }
    try {
      await connectDevice(ipInput.trim());
      setIpInput('');
      await loadDevices();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Connect failed');
    }
  };

  const handleScan = async () => {
    try {
      const result = await scanDevices();
      setDevices(result);
      setUsingMock(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Scan failed');
    }
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
          <button type="button" className="btn btn--secondary" onClick={() => void handleConnect()}>
            Add Device
          </button>
          <button type="button" className="btn btn--primary" onClick={() => void handleScan()}>
            Scan LAN
          </button>
        </div>
      </header>

      {loading && <p className="page-footer">Loading devices...</p>}
      {error && <p className="page-footer">{error}</p>}
      {usingMock && !loading && <p className="page-footer">Agent offline — showing mock data.</p>}

      <div className="device-grid">
        {devices.map((device) => (
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
              <div><dt>Android</dt><dd>{device.android_version}</dd></div>
              <div><dt>CPU</dt><dd>{device.online ? `${device.cpu_percent}%` : '-'}</dd></div>
              <div><dt>RAM</dt><dd>{device.online ? `${device.ram_percent}%` : '-'}</dd></div>
              <div><dt>Ping</dt><dd>{device.online ? `${device.ping_ms} ms` : '-'}</dd></div>
            </dl>
          </article>
        ))}
      </div>

      <footer className="page-footer">
        Selected: {selectedIds.length} device(s)
      </footer>
    </section>
  );
}
