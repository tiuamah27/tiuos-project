import type { Metadata } from 'next';
import { Providers } from '@/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'TiuOS — Server Monitor',
  description: 'Monitoring dashboard untuk infrastruktur Tiu Studio',
};

import { CommandPalette } from '@/components/ui/CommandPalette';
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          {children}
          <CommandPalette />
          <Toaster theme="system" richColors position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
