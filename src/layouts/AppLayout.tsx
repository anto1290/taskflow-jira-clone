'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Sidebar, Header } from '@/layouts';
import { useAuthStore } from '@/stores';

interface AppLayoutProps {
  children: ReactNode;
  sidebarItems?: { id: string; label: string; icon: ReactNode; href: string; badge?: number }[];
}

export default function AppLayout({ children, sidebarItems }: AppLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const defaultItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      href: '/projects',
    },
    {
      id: 'issues',
      label: 'All Issues',
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      href: '/issues',
    },
    {
      id: 'sprints',
      label: 'Sprints',
      icon: (
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      href: '/sprints',
    },
  ];

  const items = sidebarItems ?? defaultItems;
  const activeId = items.find((item) => pathname.startsWith(item.href))?.id ?? '';

  return (
    <div className="flex h-screen bg-surface-950">
      <Sidebar items={items} activeId={activeId} collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="" />
        <main id="main-content" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
