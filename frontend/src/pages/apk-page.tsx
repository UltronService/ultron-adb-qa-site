import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchApks, installApk, uploadApk } from '../api/apk-api';
import { fetchDevices } from '../api/device-api';
import { ULTRON_PLAYER_APK_SOURCE } from '../data/ultron-player-apk';
import type { ApkInfo, DeviceInfo } from '../types/api-types';

export function ApkPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apks, setApks] = useState<ApkInfo[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [selectedApkId, setSelectedApkId] = useState('');
  const [targetDeviceIds, setTargetDeviceIds] = useState<string[]>([]);
  const [installResults, setInstallResults] = useState<Record<string, string>>({});
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

  const handleUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    try {
      await uploadApk(file, '');
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Upload failed');
    }
  };

  const handleInstall = async () => {
    if (!selectedApkId || targetDeviceIds.length === 0) {
      return;
    }
    try {
      const results = await installApk(selectedApkId, targetDeviceIds);
      setInstallResults(results);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Install failed');
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
          <div><dt>Output</dt><dd><code>{ULTRON_PLAYER_APK_SOURCE.outputPath}</code></dd></div>
          <div><dt>Flavor</dt><dd>{ULTRON_PLAYER_APK_SOURCE.recommendedFlavor}</dd></div>
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
              <th>Code</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th>Notes</th>
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
                <td>{apk.version_name}</td>
                <td>{apk.version_code}</td>
                <td>{apk.size_mb} MB</td>
                <td>{apk.uploaded_at}</td>
                <td>{apk.notes}</td>
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
          <button type="button" className="btn btn--primary" onClick={() => void handleInstall()}>
            Install to selected
          </button>
        </div>
        <div className="progress-list">
          {Object.entries(installResults).map(([deviceId, status]) => (
            <div key={deviceId} className="progress-item">
              <span>{deviceId}</span>
              <span>{status}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
