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
  },
  {
    id: 'stb-spare',
    label: 'STB-Spare',
    ip: '192.168.1.105:5555',
    online: false,
    model: 'Unknown',
    androidVersion: '-',
    cpuPercent: 0,
    ramPercent: 0,
    pingMs: 0,
  },
];
