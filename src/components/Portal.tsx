'use client';

import { createPortal } from 'react-dom';
import { useEffect } from 'react';

// ─── Portal ───────────────────────────────────────────────────────────────────

interface PortalProps {
  children: ReactNode;
  containerId?: string;
}

export function Portal({ children, containerId = 'portal-root' }: PortalProps) {
  const container = typeof document !== 'undefined'
    ? document.getElementById(containerId)
    : null;

  return container ? createPortal(children, container) : <>{children}</>;
}

// ─── Skip link (accessibility) ────────────────────────────────────────────────

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:h-10 focus:px-4 focus:bg-primary-600 focus:text-neutral-50 focus:rounded-md"
    >
      Skip to main content
    </a>
  );
}
