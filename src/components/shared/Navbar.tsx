import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/upload', label: 'Upload' },
  { to: '/settings', label: 'Settings' },
];

export function Navbar() {
  const { session, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <span className="text-lg font-bold text-blue-600">FinanceAF</span>
        <div className="flex flex-1 gap-1">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{session?.user?.email}</span>
          <button
            onClick={() => signOut()}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
