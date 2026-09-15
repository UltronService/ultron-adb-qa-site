export interface MockDevice {
  id: string;
  label: string;
  ip: string;
  online: boolean;
  model: string;
  androidVersion: string;
  cpuPercent: number;
  ramPercent: number;
  pingMs: number;
  productBrand: string;
  productManufacturer: string;
  productModel: string;
  brandName: string;
  branchName: string;
  playerDeviceId: number | null;
  categoryName: string;
  installedApkVersion: string;
  lastScheduleSyncAt: string;
}

export const MOCK_DEVICES: MockDevice[] = [
  {
    id: 'stb-176',
    label: 'STB-176',
    ip: '192.168.1.176:5555',
    online: true,
    model: 'Hi3751V560_DMOD',
    androidVersion: '9',
    cpuPercent: 28,
    ramPercent: 58,
    pingMs: 3,
    productBrand: 'AOC',
    productManufacturer: 'TAISHAN',
    productModel: 'Hi3751V560',
    brandName: 'Demo Brand',
    branchName: '台北信義店',
    playerDeviceId: 1001,
    categoryName: '大螢幕',
    installedApkVersion: 'v1.0.0(10053)',
    lastScheduleSyncAt: '2026-09-14',
  },
  {
    id: 'stb-148',
    label: 'STB-148',
    ip: '192.168.1.148:5555',
    online: true,
    model: 'taishan (gk6760v100)',
    androidVersion: '9',
    cpuPercent: 35,
    ramPercent: 64,
    pingMs: 5,
    productBrand: 'AOC',
    productManufacturer: 'TAISHAN',
    productModel: 'taishan',
    brandName: 'Demo Brand',
    branchName: '台中逢甲店',
    playerDeviceId: 1002,
    categoryName: '櫃台',
    installedApkVersion: 'v1.0.0(10053)',
    lastScheduleSyncAt: '2026-09-14',
  },
  {
    id: 'stb-spare',
    label: 'STB-Spare',
    ip: '192.168.1.105:5555',
    online: false,
    model: '未知',
    androidVersion: '-',
    cpuPercent: 0,
    ramPercent: 0,
    pingMs: 0,
    productBrand: '',
    productManufacturer: '',
    productModel: '',
    brandName: '',
    branchName: '',
    playerDeviceId: null,
    categoryName: '',
    installedApkVersion: '',
    lastScheduleSyncAt: '',
  },
];
