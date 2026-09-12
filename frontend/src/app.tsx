import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/app-layout';
import { ApkPage } from './pages/apk-page';
import { AutomationPage } from './pages/automation-page';
import { ConsolePage } from './pages/console-page';
import { DevicesPage } from './pages/devices-page';
import { ReportsPage } from './pages/reports-page';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />} path="/">
          <Route element={<Navigate replace to="/devices" />} index />
          <Route element={<DevicesPage />} path="devices" />
          <Route element={<ConsolePage />} path="console" />
          <Route element={<ApkPage />} path="apk" />
          <Route element={<AutomationPage />} path="automation" />
          <Route element={<ReportsPage />} path="reports" />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
