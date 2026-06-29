'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useTheme } from 'next-themes';
import { useTiuStore } from '@/store';
import './command-palette.css';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { dataMode, setDataMode } = useTiuStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  return (
    <div className="command-palette-overlay" onClick={() => setOpen(false)}>
      <div className="command-palette-container" onClick={(e) => e.stopPropagation()}>
        <Command>
          <Command.Input placeholder="Ketik perintah atau pencarian..." autoFocus />
          <Command.List>
            <Command.Empty>Tidak ada hasil ditemukan.</Command.Empty>

            <Command.Group heading="Theme">
              <Command.Item onSelect={() => { setTheme('light'); setOpen(false); }}>
                Ubah ke Tema Terang (Light Mode)
              </Command.Item>
              <Command.Item onSelect={() => { setTheme('dark'); setOpen(false); }}>
                Ubah ke Tema Gelap (Dark Mode)
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Data Mode">
              <Command.Item onSelect={() => { setDataMode('live'); setOpen(false); }}>
                Gunakan Data Server Asli (Live Mode)
              </Command.Item>
              <Command.Item onSelect={() => { setDataMode('mock'); setOpen(false); }}>
                Gunakan Data Simulasi (Mock Mode)
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Navigasi Dasar">
              <Command.Item onSelect={() => { window.scrollTo(0, 0); setOpen(false); }}>
                Kembali ke Atas
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
