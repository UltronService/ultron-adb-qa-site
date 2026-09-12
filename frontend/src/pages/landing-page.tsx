import { NavBar } from '../components/nav-bar';

const MODULES = [
  {
    id: 'devices',
    title: 'Device Dashboard',
    description: 'Scan the LAN, list STBs, and monitor connection status.',
  },
  {
    id: 'console',
    title: 'Interactive Console',
    description: 'Remote control, screenshots, logcat, and quick ADB actions.',
  },
  {
    id: 'apk',
    title: 'APK Repository',
    description: 'Upload builds and push installs to selected devices.',
  },
  {
    id: 'automation',
    title: 'Test Automation',
    description: 'Run scripted tests across multiple set-top boxes.',
  },
  {
    id: 'reports',
    title: 'Reports & Visual Diff',
    description: 'Review test history and compare screenshots.',
  },
] as const;

export function LandingPage() {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="landing">
        <header className="landing__hero">
          <h1>Ultron ADB QA Site</h1>
          <p>
            Web console for APK testing on multiple Android set-top boxes via ADB.
          </p>
        </header>
        <section className="landing__modules" aria-label="Planned modules">
          {MODULES.map((module) => (
            <article key={module.id} id={module.id} className="module-card">
              <h2>{module.title}</h2>
              <p>{module.description}</p>
              <span className="module-card__status">Coming soon</span>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
