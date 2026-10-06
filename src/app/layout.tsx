import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JiraClone — Project Management',
  description: 'A modern project management application',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface-950 text-primary antialiased">
        {children}
        {/* Portal root for modals/tooltips */}
        <div id="portal-root" />
      </body>
    </html>
  );
}
