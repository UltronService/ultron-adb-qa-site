import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchApks, installApk, uploadApk } from '../api/apk-api';
import { fetchDevices } from '../api/device-api';
import { Drawer } from '../components/ui/drawer';
import { Modal } from '../components/ui/modal';
import { ULTRON_PLAYER_APK_SOURCE } from '../data/ultron-player-apk';
import { useDemoMode } from '../hooks/use-demo-mode';
import { useToast } from '../hooks/use-toast';
import type { ApkInfo, DeviceInfo } from '../types/api-types';

interface InstallProgressRow {
  deviceId: string;
  label: string;
  phase: string;
  percent: number;
}

export function ApkPage() {
  const { isDemoMode } = useDemoMode();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apks, setApks] = useState<ApkInfo[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedApkId, setSelectedApkId] = useState('');
  const [targetDeviceIds, setTargetDeviceIds] = useState<string[]>([]);
  const [detailApk, setDetailApk] = useState<ApkInfo | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [installRows, setInstallRows] = useState<InstallProgressRow[]>([]);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [apkList, deviceList] = await Promise.all([fetchApks(), fetchDevices()]);
      setApks(apkList);
      setDevices(deviceList.filter((device) => device.online));
      if (!selectedApkId && apkList[0]) {
        setSelectedApkId(apkList[0].id);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load APK data');
    }
  }, [selectedApkId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const toggleTarget = (deviceId: string) => {
    setTargetDeviceIds((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId],
    );
  };

  const simulateUpload = async (file: File) => {
    setUploadOpen(true);
    setUploadProgress(0);
    for (let step = 1; step <= 5; step += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      setUploadProgress(step * 20);
    }
    try {
      await uploadApk(file, isDemoMode ? 'demo upload' : '');
      await loadData();
      showToast(`${file.name} 上傳完成`, 'success');
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'Upload failed', 'error');
    } finally {
      setUploadOpen(false);
      setUploadProgress(0);
    }
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    await simulateUpload(file);
  };

  const simulateInstall = async () => {
    if (!selectedApkId || targetDeviceIds.length === 0) {
      return;
    }
    const rows: InstallProgressRow[] = targetDeviceIds.map((deviceId) => ({
      deviceId,
      label: devices.find((d) => d.id === deviceId)?.label ?? deviceId,
      phase: '準備中',
      percent: 0,
    }));
    setInstallRows(rows);

    for (const row of rows) {
      setInstallRows((prev) =>
        prev.map((item) =>
          item.deviceId === row.deviceId ? { ...item, phase: '傳輸 APK', percent: 35 } : item,
        ),
      );
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      setInstallRows((prev) =>
        prev.map((item) =>
          item.deviceId === row.deviceId ? { ...item, phase: '安裝中', percent: 70 } : item,
        ),
      );
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      setInstallRows((prev) =>
        prev.map((item) =>
          item.deviceId === row.deviceId ? { ...item, phase: '啟動 App', percent: 100 } : item,
        ),
      );
    }

    try {
      await installApk(selectedApkId, targetDeviceIds);
      showToast('安裝完成', 'success');
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'Install failed', 'error');
    }
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>APK Repository</h1>
          <p>Upload builds, manage versions, and push installs to selected STBs.</p>
        </div>
      </header>

      {error && <p className="page-footer">{error}</p>}

      <section className="panel">
        <h2>Ultron Player build reference</h2>
        <dl className="meta-list">
          <div><dt>App</dt><dd>{ULTRON_PLAYER_APK_SOURCE.appName}</dd></div>
          <div><dt>Package</dt><dd><code>{ULTRON_PLAYER_APK_SOURCE.packageName}</code></dd></div>
          <div><dt>Version code</dt><dd>{ULTRON_PLAYER_APK_SOURCE.versionCode}</dd></div>
          <div><dt>Build</dt><dd><code>{ULTRON_PLAYER_APK_SOURCE.buildCommand}</code></dd></div>
        </dl>
      </section>

      <div className="upload-zone">
        <p>Drop .apk here or click to upload</p>
        <input
          ref={fileInputRef}
          accept=".apk"
          hidden
          type="file"
          onChange={(event) => void handleUpload(event.target.files?.[0])}
        />
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose file
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>App</th>
              <th>Package</th>
              <th>Version</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apks.map((apk) => (
              <tr key={apk.id}>
                <td>
                  <input
                    checked={selectedApkId === apk.id}
                    name="selected-apk"
                    type="radio"
                    onChange={() => setSelectedApkId(apk.id)}
                  />
                </td>
                <td>{apk.app_name}</td>
                <td><code>{apk.package_name}</code></td>
                <td>{apk.version_name} ({apk.version_code})</td>
                <td>{apk.size_mb} MB</td>
                <td>{apk.uploaded_at}</td>
                <td>
                  <button type="button" className="btn btn--ghost" onClick={() => setDetailApk(apk)}>
                    詳情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="panel install-panel">
        <h2>Install to devices</h2>
        <div className="device-checklist">
          {devices.map((device) => (
            <label key={device.id} className="checkbox-row">
              <input
                checked={targetDeviceIds.includes(device.id)}
                type="checkbox"
                onChange={() => toggleTarget(device.id)}
              />
              {device.label} ({device.ip})
            </label>
          ))}
        </div>
        <div className="toolbar">
          <button type="button" className="btn btn--primary" onClick={() => void simulateInstall()}>
            Install to selected
          </button>
        </div>
        <div className="progress-list">
          {installRows.map((row) => (
            <div key={row.deviceId} className="progress-item progress-item--stacked">
              <span>{row.label}</span>
              <div className="progress-bar">
                <div className="progress-bar__fill" style={{ width: `${row.percent}%` }} />
              </div>
              <span>{row.phase}</span>
            </div>
          ))}
        </div>
      </section>

      <Drawer open={detailApk !== null} title={detailApk?.app_name ?? 'APK detail'} onClose={() => setDetailApk(null)}>
        {detailApk ? (
          <dl className="meta-list meta-list--stacked">
            <div><dt>Package</dt><dd><code>{detailApk.package_name}</code></dd></div>
            <div><dt>Version</dt><dd>{detailApk.version_name} ({detailApk.version_code})</dd></div>
            <div><dt>Size</dt><dd>{detailApk.size_mb} MB</dd></div>
            <div><dt>Uploaded</dt><dd>{detailApk.uploaded_at}</dd></div>
            <div><dt>Notes</dt><dd>{detailApk.notes || '—'}</dd></div>
            <div><dt>Launch</dt><dd><code>{detailApk.launch_activity ?? ULTRON_PLAYER_APK_SOURCE.launchActivity}</code></dd></div>
          </dl>
        ) : null}
      </Drawer>

      <Modal open={uploadOpen} title="Uploading APK" onClose={() => setUploadOpen(false)}>
        <p>正在上傳… {uploadProgress}%</p>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${uploadProgress}%` }} />
        </div>
      </Modal>
    </section>
  );
}
