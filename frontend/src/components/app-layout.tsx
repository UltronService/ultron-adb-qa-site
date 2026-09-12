import { Outlet } from 'react-router-dom';
import { NavBar } from './nav-bar';

export function AppLayout() {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="page-main">
        <Outlet />
      </main>
    </div>
  );
}
