import { useState } from 'react';
import { MOCK_DEVICES } from '../data/mock-devices';

interface MockApk {
  id: string;
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  sizeMb: number;
  uploadedAt: string;
  notes: string;
}

const MOCK_APKS: MockApk[] = [
  {
    id: 'apk-1',
    appName: 'TV App',
    packageName: 'com.example.tvapp',
    versionName: '2.1.0',
    versionCode: 210,
    sizeMb: 48.2,
    uploadedAt: '2026-09-10 14:22',
    notes: 'Player hotfix build',
  },
  {
    id: 'apk-2',
    appName: 'TV App',
    packageName: 'com.example.tvapp',
    versionName: '2.0.3',
    versionCode: 203,
    sizeMb: 47.8,
    uploadedAt: '2026-09-05 09:10',
    notes: 'Regression baseline',
  },
  {
    id: 'apk-3',
    appName: 'TV App Beta',
    packageName: 'com.example.tvapp.beta',
    versionName: '2.2.0-beta1',
    versionCode: 220,
    sizeMb: 49.1,
    uploadedAt: '2026-09-11 18:40',
    notes: 'New login flow test',
  },
];

export function ApkPage() {
  const [selectedApkId, setSelectedApkId] = useState(MOCK_APKS[0]?.id ?? '');
  const [targetDeviceIds, setTargetDeviceIds] = useState<string[]>(['stb-1', 'stb-2']);
  const [allowOverlay, setAllowOverlay] = useState(true);

  const toggleTarget = (deviceId: string) => {
    setTargetDeviceIds((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId],
    );
  };

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>APK Repository</h1>
          <p>Upload builds, manage versions, and push installs to selected STBs.</p>
        </div>
      </header>

      <div className="upload-zone">
        <p>Drop .apk here or click to upload</p>
        <button type="button" className="btn btn--primary">Choose file</button>
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
            {MOCK_APKS.map((apk) => (
              <tr key={apk.id}>
                <td>
                  <input
                    checked={selectedApkId === apk.id}
                    name="selected-apk"
                    type="radio"
                    onChange={() => setSelectedApkId(apk.id)}
                  />
                </td>
                <td>{apk.appName}</td>
                <td><code>{apk.packageName}</code></td>
                <td>{apk.versionName}</td>
                <td>{apk.versionCode}</td>
                <td>{apk.sizeMb} MB</td>
                <td>{apk.uploadedAt}</td>
                <td>
                  <input className="input input--compact" defaultValue={apk.notes} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="panel install-panel">
        <h2>Install to devices</h2>
        <div className="device-checklist">
          {MOCK_DEVICES.filter((d) => d.online).map((device) => (
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
        <label className="checkbox-row">
          <input
            checked={allowOverlay}
            type="checkbox"
            onChange={(event) => setAllowOverlay(event.target.checked)}
          />
          Allow overlay install (replace existing)
        </label>
        <div className="toolbar">
          <button type="button" className="btn btn--primary">Install to selected</button>
          <button type="button" className="btn btn--danger">Uninstall from selected</button>
        </div>
        <div className="progress-list">
          <div className="progress-item">
            <span>STB-LivingRoom</span>
            <div className="progress-bar"><div className="progress-bar__fill" style={{ width: '70%' }} /></div>
            <span>Installing… 70%</span>
          </div>
        </div>
      </section>
    </section>
  );
}
