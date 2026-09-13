export interface MockHomeActivity {
  id: string;
  time: string;
  title: string;
  detail: string;
  tone: 'success' | 'warn' | 'info';
}

export const MOCK_HOME_ACTIVITIES: MockHomeActivity[] = [
  {
    id: 'act-1',
    time: '今天 09:42',
    title: 'Ultron Player 已安裝',
    detail: 'STB-176、STB-148 · v10053',
    tone: 'success',
  },
  {
    id: 'act-2',
    time: '今天 09:18',
    title: '冷啟動測試完成',
    detail: '2 通過 · 1 失敗（STB-Spare 離線）',
    tone: 'warn',
  },
  {
    id: 'act-3',
    time: '昨天 16:05',
    title: 'Logcat 匯出',
    detail: 'STB-176 · com.ultron.player · 1,240 行',
    tone: 'info',
  },
  {
    id: 'act-4',
    time: '昨天 11:20',
    title: 'Monkey 壓力測試批次',
    detail: 'STB-176、STB-148 · 全部通過',
    tone: 'success',
  },
];

export const MOCK_HOME_QUICK_ACTIONS = [
  { path: '/devices', label: '管理裝置', hint: '連線 STB、掃描 LAN' },
  { path: '/apk', label: '安裝 APK', hint: 'Ultron Player v10053' },
  { path: '/console', label: '開啟主控台', hint: '遙控、截圖、Logcat' },
  { path: '/scripts', label: '編輯劇本', hint: '拖曳步驟、試跑' },
] as const;
