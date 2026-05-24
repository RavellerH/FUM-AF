import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from '../components/Auth/AuthGuard';
import { PasswordGate } from '../components/Auth/PasswordGate';
import { Navbar } from '../components/shared/Navbar';
import { DashboardPage } from '../components/Dashboard/DashboardPage';
import { UploadPage } from '../components/Upload/UploadPage';
import { TransactionsPage } from '../components/Transactions/TransactionsPage';
import { SettingsPage } from '../components/Settings/SettingsPage';

export default function App() {
  return (
    <PasswordGate>
    <HashRouter>
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </AuthGuard>
    </HashRouter>
    </PasswordGate>
  );
}
