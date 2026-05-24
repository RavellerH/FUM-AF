import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LoginPage } from './LoginPage';
import { Spinner } from '../shared/Spinner';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, loading, isWhitelisted, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) return <LoginPage />;

  if (!isWhitelisted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="rounded-2xl bg-white p-8 text-center shadow-md">
          <h2 className="mb-2 text-xl font-bold text-red-600">Access Denied</h2>
          <p className="mb-4 text-sm text-gray-500">
            This app is for personal use only. Your account ({session.user.email}) is not authorized.
          </p>
          <button
            onClick={() => signOut()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
