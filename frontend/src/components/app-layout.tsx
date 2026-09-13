import { Outlet } from 'react-router-dom';
import { DemoBanner } from './demo-banner';
import { NavBar } from './nav-bar';
import { StatusBar } from './status-bar';

export function AppLayout() {
  return (
    <div className="app-shell">
      <DemoBanner />
      <NavBar />
      <StatusBar />
      <main className="page-main">
        <Outlet />
      </main>
    </div>
  );
}
