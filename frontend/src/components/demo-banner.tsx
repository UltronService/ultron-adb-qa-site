import { useDemoMode } from '../context/demo-mode-context';

export function DemoBanner() {
  const { isDemoMode } = useDemoMode();
  if (!isDemoMode) {
    return null;
  }
  return (
    <div className="demo-banner" role="status">
      展示模式 · 使用假資料模擬操作（Agent 離線時自動啟用）
    </div>
  );
}
