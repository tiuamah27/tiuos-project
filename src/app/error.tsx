'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: 24, textAlign: 'center'
    }}>
      <h2 style={{ fontSize: 24, marginBottom: 12, color: 'var(--danger)' }}>Terjadi Kesalahan!</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        TiuOS mendeteksi error tak terduga saat me-render halaman ini.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => reset()}
          style={{
            background: 'var(--accent)', color: '#000', border: 'none', padding: '10px 16px',
            borderRadius: 6, cursor: 'pointer', fontWeight: 600
          }}
        >
          Coba Lagi
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)',
            padding: '10px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 500
          }}
        >
          Refresh Halaman
        </button>
      </div>
    </div>
  );
}
