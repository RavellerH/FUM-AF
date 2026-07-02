import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/analysis', label: 'Analysis' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/investment', label: 'Investment' },
  { to: '/settings', label: 'Settings' },
];

export function Navbar() {
  const { session, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
      isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900'
    }`;

  return (
    <nav className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <span className="text-lg font-bold text-blue-600">FinanceAF</span>

        {/* Desktop links */}
        <div className="hidden flex-1 gap-1 sm:flex">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} className={linkCls}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <span className="text-xs text-gray-400">{session?.user?.email}</span>
          <button
            onClick={() => signOut()}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="ml-auto rounded-md p-2 text-gray-500 hover:bg-gray-100 sm:hidden"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 sm:hidden">
          <div className="flex flex-col gap-1">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} className={linkCls} onClick={() => setMenuOpen(false)}>
                {l.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="truncate text-xs text-gray-400">{session?.user?.email}</span>
            <button
              onClick={() => signOut()}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
