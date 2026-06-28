import { type ClassValue, clsx } from 'clsx';

// clsx may not be installed, provide fallback
export function cn(...inputs: ClassValue[]): string {
  try {
    return clsx(inputs);
  } catch {
    return inputs.filter(Boolean).join(' ');
  }
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  return `${days} hari lalu`;
}

export function cpuColor(pct: number): string {
  if (pct < 50) return 'var(--success)';
  if (pct < 80) return 'var(--warning)';
  return 'var(--danger)';
}

export function diskColor(pct: number): string {
  if (pct < 60) return 'var(--success)';
  if (pct < 85) return 'var(--warning)';
  return 'var(--danger)';
}

export function statusColor(status: string): string {
  switch (status) {
    case 'running': return 'var(--success)';
    case 'paused':  return 'var(--warning)';
    case 'restarting': return 'var(--info)';
    default:        return 'var(--danger)';
  }
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    running: 'Berjalan',
    stopped: 'Berhenti',
    paused: 'Jeda',
    restarting: 'Restart',
    dead: 'Mati',
  };
  return map[status] ?? status;
}

export function getFileIcon(name: string, type: 'file' | 'dir' | 'symlink'): string {
  if (type === 'dir') return '📁';
  if (type === 'symlink') return '🔗';
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const icons: Record<string, string> = {
    env: '🔒', log: '📋', json: '{}', yaml: '⚙️', yml: '⚙️',
    toml: '⚙️', conf: '⚙️', ini: '⚙️', sh: '💻', md: '📝',
    txt: '📄', js: '🟨', ts: '🔷', py: '🐍',
  };
  return icons[ext] ?? (name.startsWith('.') ? '🔒' : '📄');
}

export function isSensitiveKey(key: string): boolean {
  const patterns = ['password', 'secret', 'key', 'token', 'pass', 'private', 'auth', 'credential', 'pwd'];
  const lower = key.toLowerCase();
  return patterns.some(p => lower.includes(p));
}
