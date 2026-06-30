'use client';

import { useEffect, useState } from 'react';
import { useAlertMonitor } from '@/hooks/useAlertMonitor';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useAlertMonitor();

  useEffect(() => setMounted(true), []);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-base)',
      position: 'relative'
    }}>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
