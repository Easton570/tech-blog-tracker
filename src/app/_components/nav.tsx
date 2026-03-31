'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
      </svg>
    ),
  },
  {
    href: '/blogs',
    label: 'Blogs',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
      </svg>
    ),
  },
  {
    href: '/feed',
    label: 'Feed',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 19.5v-.75a7.5 7.5 0 00-7.5-7.5H4.5m0-6.75h.75c7.87 0 14.25 6.38 14.25 14.25v.75M6 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
  },
  {
    href: '/digests',
    label: 'Digests',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-16 lg:w-56 bg-surface-1 border-r border-surface-3 z-50 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-surface-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-sm bg-accent/10 border border-accent/30 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-accent-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div className="hidden lg:block">
            <span className="font-mono text-xs font-semibold tracking-wider text-text-primary">BLOGSCOPE</span>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="hidden lg:flex items-center gap-2 px-4 py-2.5 border-b border-surface-3">
        <span className="status-dot status-dot-active animate-pulse-slow" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-terminal-green/80">System Online</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200
                ${isActive
                  ? 'bg-accent/10 text-accent-light border border-accent/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-2 border border-transparent'
                }
              `}
            >
              <span className={isActive ? 'text-accent-light' : 'text-text-dim'}>{item.icon}</span>
              <span className="hidden lg:block font-mono text-xs tracking-wide">{item.label}</span>
              {isActive && (
                <span className="hidden lg:block ml-auto w-1 h-1 rounded-full bg-accent-light" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="hidden lg:block px-4 py-3 border-t border-surface-3">
        <p className="font-mono text-[9px] uppercase tracking-widest text-text-dim">
          HN Top 100 Tracker
        </p>
        <p className="font-mono text-[9px] text-text-dim mt-0.5">
          v1.0.0
        </p>
      </div>
    </aside>
  );
}
