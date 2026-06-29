'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', padding: 24, textAlign: 'center', background: '#0a0a0a', color: '#e8e8e6',
          fontFamily: 'sans-serif'
        }}>
          <h2 style={{ fontSize: 24, marginBottom: 12, color: '#ef4444' }}>Terjadi Kesalahan Fatal!</h2>
          <p style={{ color: '#9a9a96', marginBottom: 24 }}>
            TiuOS mendeteksi error tak terduga di root aplikasi.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#39d353', color: '#000', border: 'none', padding: '10px 16px',
              borderRadius: 6, cursor: 'pointer', fontWeight: 600
            }}
          >
            Coba Lagi
          </button>
        </div>
      </body>
    </html>
  );
}
