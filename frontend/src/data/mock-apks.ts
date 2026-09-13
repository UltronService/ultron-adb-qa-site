import { ULTRON_PLAYER_APK_SOURCE } from './ultron-player-apk';
import type { ApkInfo } from '../types/api-types';

export const MOCK_APKS: ApkInfo[] = [
  {
    id: 'apk-ultron-10053',
    app_name: ULTRON_PLAYER_APK_SOURCE.appName,
    package_name: ULTRON_PLAYER_APK_SOURCE.packageName,
    version_name: '1.0.0',
    version_code: 10053,
    size_mb: 48.2,
    uploaded_at: '2026-09-07 14:30',
    notes: 'GCS 正式版',
    launch_activity: ULTRON_PLAYER_APK_SOURCE.launchActivity,
  },
  {
    id: 'apk-ultron-10042',
    app_name: ULTRON_PLAYER_APK_SOURCE.appName,
    package_name: ULTRON_PLAYER_APK_SOURCE.packageName,
    version_name: '1.0.0',
    version_code: 10042,
    size_mb: 47.8,
    uploaded_at: '2026-09-05 09:15',
    notes: 'demo 版 QA 建置',
    launch_activity: ULTRON_PLAYER_APK_SOURCE.launchActivity,
  },
];
