import type { ReactNode } from 'react';

// Auth guard no longer blocks on PAT — reads are public. PAT is managed in Settings.
export function AuthGuard({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
