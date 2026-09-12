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
    id: 'stb-1',
    label: 'STB-LivingRoom',
    ip: '192.168.1.101:5555',
    online: true,
    model: 'X96 Max+',
    androidVersion: '11',
    cpuPercent: 23,
    ramPercent: 61,
    pingMs: 4,
  },
  {
    id: 'stb-2',
    label: 'STB-QA-Bench',
    ip: '192.168.1.102:5555',
    online: true,
    model: 'Tanix TX3',
    androidVersion: '9',
    cpuPercent: 41,
    ramPercent: 72,
    pingMs: 6,
  },
  {
    id: 'stb-3',
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
