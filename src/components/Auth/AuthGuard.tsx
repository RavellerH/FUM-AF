import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoginPage } from './LoginPage';
import { Spinner } from '../shared/Spinner';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { verified, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!verified) return <LoginPage />;

  return <>{children}</>;
}
