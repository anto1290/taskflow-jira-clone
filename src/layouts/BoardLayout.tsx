'use client';

import AppLayout from './AppLayout';
import { Header } from './index';
import { ProtectedRoute } from '@/components/RouteGuards';

interface BoardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  onSearch?: (q: string) => void;
  searchPlaceholder?: string;
  actions?: ReactNode;
}

export default function BoardLayout({ children, title, subtitle, onSearch, searchPlaceholder, actions }: BoardLayoutProps) {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="h-full flex flex-col">
          <Header
            title={title}
            subtitle={subtitle}
            onSearch={onSearch}
            searchPlaceholder={searchPlaceholder}
            actions={actions}
          />
          <div className="flex-1 overflow-hidden p-4">
            {children}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

export { Sidebar, Header } from './index';
export type { NavItem as SidebarNavItem } from './index';
