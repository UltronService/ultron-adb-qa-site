import { useCallback, useEffect, useState } from 'react';
import { connectDevice, fetchDevices, scanDevices } from '../api/device-api';
import { Drawer } from '../components/ui/drawer';
import { Skeleton } from '../components/ui/skeleton';
import { useDemoMode } from '../hooks/use-demo-mode';
import { useToast } from '../hooks/use-toast';
import { formatDeviceField } from '../lib/format-device-field';
import type { DeviceInfo } from '../types/api-types';

export function DevicesPage() {
  const { isDemoMode } = useDemoMode();
  const { showToast } = useToast();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [ipInput, setIpInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [detailDevice, setDetailDevice] = useState<DeviceInfo | null>(null);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchDevices();
      setDevices(result);
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
      const device = await connectDevice(ipInput.trim());
      setIpInput('');
      await loadDevices();
      showToast(`已加入 ${device.label}${isDemoMode ? '（展示模式）' : ''}`, 'success');
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : '連線失敗', 'error');
    }
  };

  const handleScan = async () => {
    setScanning(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    try {
      const result = await scanDevices();
      setDevices(result);
      showToast(`掃描完成，找到 ${result.length} 台裝置`, 'success');
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : '掃描失敗', 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleBatchAction = (action: string) => {
    showToast(`已對 ${selectedIds.length} 台裝置執行「${action}」（展示模式模擬）`, 'info');
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>裝置管理</h1>
          <p>管理機上盒、掃描區域網路，並監控連線狀態。</p>
        </div>
        <div className="toolbar">
          <input
            className="input"
            placeholder="192.168.1.x:5555"
            value={ipInput}
            onChange={(event) => setIpInput(event.target.value)}
          />
          <button type="button" className="btn btn--secondary" onClick={() => void handleConnect()}>
            新增裝置
          </button>
          <button type="button" className="btn btn--primary" onClick={() => void handleScan()} disabled={scanning}>
            {scanning ? '掃描中…' : '掃描區域網路'}
          </button>
        </div>
      </header>

      {selectedIds.length > 0 ? (
        <div className="batch-bar">
          <span>已選 {selectedIds.length} 台</span>
          <button type="button" className="btn btn--secondary" onClick={() => handleBatchAction('重新連線')}>
            重新連線
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => handleBatchAction('中斷連線')}>
            中斷連線
          </button>
        </div>
      ) : null}

      {loading || scanning ? <Skeleton lines={4} /> : null}

      <div className="device-grid">
        {devices.map((device) => (
          <article
            key={device.id}
            className="device-card device-card--clickable"
            onClick={() => setDetailDevice(device)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                setDetailDevice(device);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="device-card__top">
              <label className="checkbox-row" onClick={(event) => event.stopPropagation()}>
                <input
                  checked={selectedIds.includes(device.id)}
                  type="checkbox"
                  onChange={() => toggleDevice(device.id)}
                />
                <span className={`status-dot ${device.online ? 'status-dot--online' : 'status-dot--offline'}`} />
                <strong>{device.label}</strong>
              </label>
              <span className="badge">{device.online ? '線上' : '離線'}</span>
            </div>
            <dl className="meta-list">
              <div><dt>IP</dt><dd>{device.ip}</dd></div>
              <div><dt>型號</dt><dd>{device.model}</dd></div>
              <div><dt>品牌</dt><dd>{formatDeviceField(device.brand_name)}</dd></div>
              <div><dt>店家</dt><dd>{formatDeviceField(device.branch_name)}</dd></div>
              <div><dt>Device ID</dt><dd>{formatDeviceField(device.player_device_id)}</dd></div>
              <div><dt>類別</dt><dd>{formatDeviceField(device.category_name)}</dd></div>
              <div><dt>APK 版號</dt><dd>{formatDeviceField(device.installed_apk_version)}</dd></div>
              <div><dt>排程同步</dt><dd>{formatDeviceField(device.last_schedule_sync_at)}</dd></div>
            </dl>
            <div className="device-card__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  setDetailDevice(device);
                }}
              >
                詳情
              </button>
            </div>
          </article>
        ))}
      </div>

      <Drawer
        open={detailDevice !== null}
        title={detailDevice?.label ?? '裝置詳情'}
        onClose={() => setDetailDevice(null)}
      >
        {detailDevice ? (
          <>
            <dl className="meta-list meta-list--stacked">
              <div><dt>ADB 序號</dt><dd><code>{detailDevice.id}</code></dd></div>
              <div><dt>IP</dt><dd>{detailDevice.ip}</dd></div>
              <div><dt>型號</dt><dd>{detailDevice.model}</dd></div>
              <div><dt>品牌</dt><dd>{formatDeviceField(detailDevice.brand_name)}</dd></div>
              <div><dt>店家</dt><dd>{formatDeviceField(detailDevice.branch_name)}</dd></div>
              <div><dt>Device ID</dt><dd>{formatDeviceField(detailDevice.player_device_id)}</dd></div>
              <div><dt>類別</dt><dd>{formatDeviceField(detailDevice.category_name)}</dd></div>
              <div><dt>APK 版號</dt><dd>{formatDeviceField(detailDevice.installed_apk_version)}</dd></div>
              <div><dt>排程同步</dt><dd>{formatDeviceField(detailDevice.last_schedule_sync_at)}</dd></div>
              <div><dt>狀態</dt><dd>{detailDevice.online ? '線上' : '離線'}</dd></div>
            </dl>
            <p className="page-footer">點選卡片可查看規格；勾選後可用上方批次操作列。</p>
          </>
        ) : null}
      </Drawer>

      <footer className="page-footer">
        已選 {selectedIds.length} 台裝置
      </footer>
    </section>
  );
}
