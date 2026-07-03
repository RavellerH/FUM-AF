import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from '../components/Auth/AuthGuard';
import { PasswordGate } from '../components/Auth/PasswordGate';
import { Navbar } from '../components/shared/Navbar';
import { DashboardPage } from '../components/Dashboard/DashboardPage';
import { TransactionsPage } from '../components/Transactions/TransactionsPage';
import { UploadPage } from '../components/Upload/UploadPage';
import { InvestmentPage } from '../components/Investment/InvestmentPage';
import { AnalysisPage } from '../components/Analysis/AnalysisPage';
import { SettingsPage } from '../components/Settings/SettingsPage';

export default function App() {
  return (
    <PasswordGate>
    <HashRouter>
      <AuthGuard>
        <div className="min-h-screen bg-slate-100 pb-20 md:pb-0">
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/investment" element={<InvestmentPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </AuthGuard>
    </HashRouter>
    </PasswordGate>
  );
}
