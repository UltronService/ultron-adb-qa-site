import { MOCK_DEVICES } from '../data/mock-devices';
import type { DeviceInfo } from '../types/api-types';

export function mapMockDeviceToApi(device: (typeof MOCK_DEVICES)[number]): DeviceInfo {
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
    product_brand: device.productBrand,
    product_manufacturer: device.productManufacturer,
    product_model: device.productModel,
    brand_name: device.brandName,
    branch_name: device.branchName,
    player_device_id: device.playerDeviceId,
    category_name: device.categoryName,
    installed_apk_version: device.installedApkVersion,
    last_schedule_sync_at: device.lastScheduleSyncAt,
    setup_box: device.setupBox,
    public_ip: device.publicIp,
    version_code: device.versionCode,
  };
}

export function getMockDevices(): DeviceInfo[] {
  return MOCK_DEVICES.map(mapMockDeviceToApi);
}
