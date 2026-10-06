'use client';

import React, { ReactNode, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores';

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  href: string;
  badge?: number;
}

interface SidebarProps {
  items: NavItem[];
  activeId: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ items, activeId, collapsed = false, onToggleCollapse }: SidebarProps) {
  const { user } = useAuthStore();

  return (
    <aside
      className={`${
        collapsed ? 'w-[72px]' : 'w-[264px]'
      } flex flex-col bg-surface-900 border-r border-neutral-800 h-full transition-all duration-200`}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 shrink-0">
        <div className="flex items-center gap-3 w-full">
          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-primary truncate">JiraClone</span>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 h-10 px-3 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-500/10 text-primary-400 border-l-[3px] border-primary-500 -ml-[1px]'
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="shrink-0 w-5 h-5 flex items-center justify-center">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="text-xs bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </a>
          );
        })}
      </nav>

      {/* User section */}
      {!collapsed && user && (
        <div className="border-t border-neutral-800 p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-sm font-semibold shrink-0">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary truncate">{user.displayName}</p>
              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="m-2 p-2 rounded-md text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          {collapsed ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          )}
        </svg>
      </button>
    </aside>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export function Header({ title, subtitle, actions, onSearch, searchPlaceholder = 'Search…' }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-surface-900 border-b border-neutral-800 flex items-center px-6 gap-4 shrink-0">
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-primary truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-neutral-500 truncate">{subtitle}</p>
        )}
      </div>

      {/* Search */}
      {onSearch && (
        <div className="relative w-64">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full h-8 pl-9 pr-3 text-sm bg-neutral-900 border border-neutral-700 rounded-md text-primary placeholder-neutral-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
            aria-label={searchPlaceholder}
          />
        </div>
      )}

      {/* Actions */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      {/* User menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-neutral-800 transition-colors"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-semibold">
            {user?.displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-neutral-300 hidden sm:block">{user?.displayName}</span>
          <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-surface-800 border border-neutral-700 rounded-lg shadow-xl shadow-black/40 py-1 z-50">
            <div className="px-3 py-2 border-b border-neutral-700">
              <p className="text-sm font-medium text-primary">{user?.displayName}</p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { setMenuOpen(false); logout.mutate(); }}
              className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-primary transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
