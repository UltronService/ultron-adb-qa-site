import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/app-layout';
import { AppProviders } from './components/app-providers';
import { ApkPage } from './pages/apk-page';
import { AutomationPage } from './pages/automation-page';
import { ConsolePage } from './pages/console-page';
import { DevicesPage } from './pages/devices-page';
import { HomePage } from './pages/home-page';
import { ReportsPage } from './pages/reports-page';
import { ScriptsPage } from './pages/scripts-page';

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '');

export function App() {
  return (
    <AppProviders>
      <BrowserRouter basename={routerBasename}>
        <Routes>
          <Route element={<AppLayout />} path="/">
            <Route element={<HomePage />} index />
            <Route element={<DevicesPage />} path="devices" />
            <Route element={<ConsolePage />} path="console" />
            <Route element={<ApkPage />} path="apk" />
            <Route element={<AutomationPage />} path="automation" />
            <Route element={<ScriptsPage />} path="scripts" />
            <Route element={<ReportsPage />} path="reports" />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}
