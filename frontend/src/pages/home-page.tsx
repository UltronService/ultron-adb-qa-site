import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDevices } from '../api/device-api';
import { MOCK_HOME_ACTIVITIES, MOCK_HOME_QUICK_ACTIONS } from '../data/mock-home';
import { MOCK_REPORTS } from '../data/mock-reports';
import { MOCK_APKS } from '../data/mock-apks';
import { useDemoMode } from '../hooks/use-demo-mode';
import type { DeviceInfo } from '../types/api-types';

interface DashboardStats {
  onlineCount: number;
  totalDevices: number;
  lastRunLabel: string;
  apkCount: number;
  openIssues: number;
}

function buildStats(devices: DeviceInfo[]): DashboardStats {
  const onlineCount = devices.filter((device) => device.online).length;
  const lastReport = MOCK_REPORTS[0];
  const openIssues = MOCK_REPORTS.reduce((sum, report) => sum + report.fail_count, 0);

  return {
    onlineCount,
    totalDevices: devices.length,
    lastRunLabel: lastReport ? `${lastReport.template} · ${lastReport.date}` : '—',
    apkCount: MOCK_APKS.length,
    openIssues,
  };
}

export function HomePage() {
  const { isDemoMode } = useDemoMode();
  const [stats, setStats] = useState<DashboardStats>({
    onlineCount: 0,
    totalDevices: 0,
    lastRunLabel: '—',
    apkCount: 0,
    openIssues: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      try {
        const devices = await fetchDevices();
        if (!cancelled) {
          setStats(buildStats(devices));
        }
      } catch {
        if (!cancelled) {
          setStats(buildStats([]));
        }
      }
    };

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page home-page">
      <header className="page-header home-page__header">
        <div>
          <p className="home-page__eyebrow">Ultron QA 主控台</p>
          <h1>總覽</h1>
          <p>
            {isDemoMode
              ? '展示模式：以下數據為辦公室 STB 示意（.176 / .148）'
              : '連線 Agent 後可在此快速掌握裝置與測試狀態'}
          </p>
        </div>
      </header>

      <section className="stat-grid" aria-label="關鍵指標">
        <article className="stat-card">
          <span className="stat-card__label">線上裝置</span>
          <strong className="stat-card__value">
            {stats.onlineCount}
            <span className="stat-card__suffix">/ {stats.totalDevices}</span>
          </strong>
          <span className="stat-card__hint">STB-176 · STB-148 已就緒</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">最近測試</span>
          <strong className="stat-card__value stat-card__value--sm">{stats.lastRunLabel}</strong>
          <span className="stat-card__hint">自動化 / 報表</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">APK 就緒</span>
          <strong className="stat-card__value">{stats.apkCount}</strong>
          <span className="stat-card__hint">含 Ultron Player v10053</span>
        </article>
        <article className="stat-card">
          <span className="stat-card__label">待追蹤問題</span>
          <strong className="stat-card__value">{stats.openIssues}</strong>
          <span className="stat-card__hint">報表中的失敗項</span>
        </article>
      </section>

      <section className="home-page__grid">
        <div className="panel">
          <h2>快速操作</h2>
          <div className="quick-action-grid">
            {MOCK_HOME_QUICK_ACTIONS.map((action) => (
              <Link key={action.path} className="quick-action-card" to={action.path}>
                <span className="quick-action-card__title">{action.label}</span>
                <span className="quick-action-card__hint">{action.hint}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>最近動態</h2>
          <ul className="activity-list">
            {MOCK_HOME_ACTIVITIES.map((item) => (
              <li key={item.id} className={`activity-list__item activity-list__item--${item.tone}`}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <time>{item.time}</time>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
