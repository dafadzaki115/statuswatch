'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Server,
  Radio,
  Settings,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface AppNavProps {
  userEmail: string;
  planName: string;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}

export function AppNav({ userEmail, planName, logoutAction, children }: AppNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/monitors', label: 'Monitor', icon: Server },
    { href: '/status-pages', label: 'Status Page', icon: Radio },
    { href: '/settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-background sticky top-0 z-40">
        <Link href="/dashboard" className="font-semibold text-sm tracking-tight text-foreground">
          StatusWatch
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-muted"
            aria-label="Buka Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop permanent 240px, Mobile drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-[240px] border-r border-border bg-background flex flex-col justify-between z-50 transition-transform md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Brand Wordmark (no generic icons or ping animations) */}
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="font-semibold text-base tracking-tight text-foreground"
            >
              StatusWatch
            </Link>
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-muted text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout at bottom */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <UserIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="font-mono text-muted-foreground truncate">{userEmail}</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-muted border border-border text-foreground font-medium shrink-0">
              {planName}
            </span>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 max-w-6xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
