'use client';

import { useQuery } from '@tanstack/react-query';
import { useTiuStore } from '@/store';
import { listFiles, readFile } from '@/services';
import { Card, SectionLabel, Skeleton, ErrorState, CopyBox, EmptyState } from '@/components/ui';
import { getFileIcon, formatRelativeTime } from '@/lib/utils';
import { FileEntry, FileContent } from '@/types';
import { useState } from 'react';
import { ChevronRight, ChevronDown, Lock, AlertTriangle, ChevronLeft } from 'lucide-react';

// ── File Tree Node ────────────────────────────────────────────
function TreeNode({
  entry, depth, isOpen, isSelected,
  onToggle, onSelect,
}: {
  entry: FileEntry; depth: number;
  isOpen: boolean; isSelected: boolean;
  onToggle: () => void; onSelect: () => void;
}) {
  return (
    <div
      onClick={entry.type === 'dir' ? onToggle : onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 8px',
        paddingLeft: 8 + depth * 16,
        borderRadius: 5, cursor: 'pointer', margin: '1px 4px',
        background: isSelected ? 'var(--accent-bg)' : 'transparent',
        border: `1px solid ${isSelected ? 'var(--accent-border)' : 'transparent'}`,
        transition: 'all 0.1s',
      }}
      onMouseEnter={e => {
        if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
      }}
      onMouseLeave={e => {
        if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      {entry.type === 'dir' ? (
        isOpen
          ? <ChevronDown size={11} color="var(--text-muted)" />
          : <ChevronRight size={11} color="var(--text-muted)" />
      ) : (
        <span style={{ width: 11 }} />
      )}
      <span style={{ fontSize: 13 }}>{getFileIcon(entry.name, entry.type)}</span>
      <span style={{
        fontSize: 12, fontWeight: entry.type === 'dir' ? 500 : 400,
        color: entry.isSensitive ? 'var(--warning)' : entry.type === 'dir' ? 'var(--text-primary)' : 'var(--text-secondary)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {entry.name}
      </span>
      {entry.isSensitive && <Lock size={10} color="var(--warning)" style={{ flexShrink: 0 }} />}
    </div>
  );
}

// ── File Preview ──────────────────────────────────────────────
function FilePreview({ content }: { content: FileContent }) {
  if (content.encoding === 'binary') {
    return <EmptyState icon="🚫" message="File binary tidak dapat dipreview" />;
  }
  if (content.encoding === 'too-large') {
    return <EmptyState icon="📦" message="File terlalu besar untuk dipreview" />;
  }

  return (
    <div style={{ position: 'relative' }}>
      {content.isSensored && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', marginBottom: 8,
          background: 'var(--warning-bg)', borderRadius: 6,
          border: '1px solid rgba(245,158,11,0.2)',
        }}>
          <Lock size={11} color="var(--warning)" />
          <span style={{ fontSize: 11, color: 'var(--warning)' }}>
            Nilai sensitif disensor otomatis ({content.sensoredKeys.join(', ')})
          </span>
        </div>
      )}
      <pre style={{
        margin: 0, padding: '12px 14px',
        background: 'var(--bg-base)', borderRadius: 8,
        border: '1px solid var(--border-subtle)',
        fontSize: 12, lineHeight: 1.7,
        color: 'var(--text-secondary)',
        fontFamily: 'JetBrains Mono, monospace',
        overflow: 'auto', maxHeight: '100%',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {content.content}
      </pre>
    </div>
  );
}

// ── Root paths to browse ──────────────────────────────────────
const ROOT_PATHS = ['/', '/opt', '/home', '/etc'];

// ── Main View ─────────────────────────────────────────────────
export function FilesView() {
  const { getActiveServer, activeServerId } = useTiuStore();
  const server = getActiveServer();

  const [currentPath, setCurrentPath] = useState('/opt');
  const [openDirs, setOpenDirs] = useState<Set<string>>(new Set(['/opt', '/opt/apps']));
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);

  // List current directory
  const { data: entries, isLoading } = useQuery({
    queryKey: ['files', activeServerId, currentPath],
    queryFn: () => listFiles(server.url, currentPath),
  });

  // Read selected file
  const { data: fileContent, isLoading: loadingContent, error: contentError } = useQuery({
    queryKey: ['file-content', activeServerId, selectedFile?.path],
    queryFn: () => readFile(server.url, selectedFile!.path),
    enabled: !!selectedFile && selectedFile.type === 'file',
  });

  function toggleDir(path: string) {
    setOpenDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
    setCurrentPath(path);
  }

  function selectFile(entry: FileEntry) {
    setSelectedFile(entry);
  }

  // Build breadcrumb
  const breadcrumbs = currentPath.split('/').filter(Boolean);

  function goUp() {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const parent = '/' + parts.join('/');
    setCurrentPath(parent);
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', gap: 0 }}>

      {/* Tree panel */}
      <div style={{
        width: 440, flexShrink: 0, borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: 'var(--bg-surface)',
      }}>
        <div style={{ padding: '10px 8px 6px', borderBottom: '1px solid var(--border-subtle)' }}>
          <SectionLabel>Direktori</SectionLabel>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={goUp}
              disabled={currentPath === '/'}
              title="Kembali (Naik satu tingkat)"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '2px 7px', borderRadius: 4, fontSize: 10,
                cursor: currentPath === '/' ? 'not-allowed' : 'pointer',
                border: '1px solid var(--border-default)',
                background: 'transparent',
                color: 'var(--text-muted)',
                opacity: currentPath === '/' ? 0.5 : 1,
                height: 20,
              }}
            >
              <ChevronLeft size={13} strokeWidth={2.5} />
            </button>
            {ROOT_PATHS.map(p => (
              <button key={p} onClick={() => setCurrentPath(p)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '2px 7px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
                  border: `1px solid ${currentPath.startsWith(p) && p !== '/' ? 'var(--accent-border)' : 'var(--border-default)'}`,
                  background: currentPath.startsWith(p) && p !== '/' ? 'var(--accent-bg)' : 'transparent',
                  color: currentPath.startsWith(p) && p !== '/' ? 'var(--accent)' : 'var(--text-muted)',
                  height: 20,
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '6px 0' }}>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ padding: '6px 12px' }}><Skeleton height={12} width={`${60 + i * 8}%`} /></div>
              ))
            : entries?.map(entry => (
                <TreeNode
                  key={entry.path}
                  entry={entry}
                  depth={0}
                  isOpen={openDirs.has(entry.path)}
                  isSelected={selectedFile?.path === entry.path}
                  onToggle={() => toggleDir(entry.path)}
                  onSelect={() => selectFile(entry)}
                />
              ))
          }
        </div>
      </div>

      {/* Preview panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 14, gap: 10 }}>
        {selectedFile ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SectionLabel>Preview — {selectedFile.name}</SectionLabel>
              {selectedFile.isSensitive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: -8 }}>
                  <Lock size={11} color="var(--warning)" />
                  <span style={{ fontSize: 10, color: 'var(--warning)' }}>Sensitif</span>
                </div>
              )}
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {loadingContent && <Skeleton height={200} />}
              {contentError && <ErrorState message="Gagal membaca file" />}
              {fileContent && <FilePreview content={fileContent} />}
            </div>
          </>
        ) : (
          <EmptyState icon="📂" message="Pilih file dari panel kiri untuk melihat isinya" />
        )}
      </div>

      {/* Info + commands panel */}
      {selectedFile && (
        <div style={{
          width: 460, flexShrink: 0, borderLeft: '1px solid var(--border-subtle)',
          padding: 12, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto',
          background: 'var(--bg-surface)',
        }} className="fade-in">
          <div>
            <SectionLabel>Info File</SectionLabel>
            <Card style={{ padding: 10 }}>
              {[
                ['Nama', selectedFile.name],
                ['Tipe', selectedFile.type],
                ['Diubah', formatRelativeTime(selectedFile.modifiedAt)],
                ...(selectedFile.owner ? [['Owner', selectedFile.owner]] : []),
                ...(selectedFile.permissions ? [['Permission', selectedFile.permissions]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '5px 0', borderBottom: '1px solid var(--border-subtle)',
                  fontSize: 11,
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>{v}</span>
                </div>
              ))}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '5px 0', fontSize: 11,
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Path</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 10, wordBreak: 'break-all', textAlign: 'right', maxWidth: 120 }}>
                  {selectedFile.path}
                </span>
              </div>
            </Card>
          </div>

          <div>
            <SectionLabel>Terminal Commands</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <CopyBox label="Buka folder" value={`cd ${selectedFile.path.split('/').slice(0, -1).join('/') || '/'}`} />
              {selectedFile.type === 'file' && (
                <>
                  <CopyBox label="Lihat isi" value={`cat ${selectedFile.path}`} />
                  <CopyBox label="Edit dengan nano" value={`sudo nano ${selectedFile.path}`} />
                  <CopyBox label="Edit dengan vim" value={`sudo vim ${selectedFile.path}`} />
                  <CopyBox label="Info detail" value={`ls -la ${selectedFile.path}`} />
                </>
              )}
              {selectedFile.type === 'dir' && (
                <>
                  <CopyBox label="Lihat isi folder" value={`ls -la ${selectedFile.path}`} />
                  <CopyBox label="Ukuran folder" value={`du -sh ${selectedFile.path}`} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
