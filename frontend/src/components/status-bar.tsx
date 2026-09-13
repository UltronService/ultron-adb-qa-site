import { useDemoMode } from '../context/demo-mode-context';

export function StatusBar() {
  const { isDemoMode, agentOnline, onlineDeviceCount } = useDemoMode();
  return (
    <div className="status-bar">
      <span className={`status-bar__dot ${agentOnline ? 'status-bar__dot--online' : 'status-bar__dot--offline'}`} />
      <span>{agentOnline ? 'Agent 已連線' : 'Agent 離線 · 展示模式'}</span>
      <span className="status-bar__sep">|</span>
      <span>線上裝置 {onlineDeviceCount} 台</span>
      {isDemoMode ? <span className="status-bar__tag">展示</span> : null}
    </div>
  );
}
