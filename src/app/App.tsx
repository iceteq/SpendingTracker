import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { AddPurchasePage } from '../features/transactions/AddPurchasePage';
import { SpendingProvider } from './SpendingProvider';

const SettingsPage = lazy(() => import('../features/settings/SettingsPage'));
const QrPrintPage = lazy(() => import('../features/qr/QrPrintPage'));

export function App() {
  return (
    <SpendingProvider>
      <BrowserRouter>
        <div className="app-shell">
          <a className="skip no-print" href="#main">
            Skip to content
          </a>
          <AppHeader />
          <Suspense fallback={<p className="status">Loading…</p>}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/add" element={<AddPurchasePage />} />
              <Route path="/qr" element={<QrPrintPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </SpendingProvider>
  );
}
