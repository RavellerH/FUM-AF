import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
  icon: string; // heroicon outline path
}

const links: NavItem[] = [
  { to: '/dashboard',    label: 'Dashboard',    icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
  { to: '/analysis',     label: 'Analysis',     icon: 'M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z' },
  { to: '/transactions', label: 'Transactions', icon: 'M8.25 9.75h7.5m-7.5 4.5h4.5M4.5 19.5h15a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6v12a1.5 1.5 0 001.5 1.5z' },
  { to: '/upload',       label: 'Upload',       icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5' },
  { to: '/investment',   label: 'Portfolio',    icon: 'M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941' },
  { to: '/settings',     label: 'Settings',     icon: 'M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

function Icon({ d, className }: { d: string; className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-sm font-black text-white shadow-sm">
        F
      </span>
      <span className="text-base font-bold tracking-tight text-slate-900">
        Finance<span className="text-brand-600">AF</span>
      </span>
    </span>
  );
}

export function Navbar() {
  const { session, signOut } = useAuth();

  return (
    <>
      {/* Top bar */}
      <nav className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Logo />

          {/* Desktop links */}
          <div className="hidden flex-1 gap-0.5 md:flex">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon d={l.icon} className="h-4 w-4" />
                {l.label}
              </NavLink>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3 md:ml-0">
            <span className="hidden text-xs text-slate-400 lg:inline">{session?.user?.email}</span>
            <button
              onClick={() => signOut()}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-6">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Icon d={l.icon} className="h-5 w-5" />
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
