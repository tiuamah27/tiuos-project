'use client';

import React, { useEffect, useRef, useImperativeHandle } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { AttachAddon } from '@xterm/addon-attach';
import '@xterm/xterm/css/xterm.css';

export interface TerminalClientRef {
  write: (data: string) => void;
  writeln: (data: string) => void;
  prompt: () => void;
  clear: () => void;
}

interface TerminalClientProps {
  onCommand?: (cmd: string) => void;
  onIdleTimeout: () => void;
  idleTimeoutMs?: number;
  initialText?: string;
  innerRef?: React.Ref<TerminalClientRef>;
  wsUrl?: string; // If provided, attaches to the WebSocket instead of using mock parser
}

export const TerminalClient = ({ onCommand, onIdleTimeout, idleTimeoutMs = 300000, initialText, innerRef, wsUrl }: TerminalClientProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const inputBuffer = useRef<string>('');
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      onIdleTimeout();
    }, idleTimeoutMs);
  };

  useImperativeHandle(innerRef, () => ({
    write: (data: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(data);
      } else {
        termInstance.current?.write(data.replace(/\n/g, '\r\n'));
      }
    },
    writeln: (data: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(data + '\r\n');
      } else {
        termInstance.current?.writeln(data.replace(/\n/g, '\r\n'));
      }
    },
    prompt: () => {
      if (!wsUrl) termInstance.current?.write('\r\n$ ');
    },
    clear: () => {
      termInstance.current?.clear();
    }
  }));

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        selectionBackground: 'rgba(88, 166, 255, 0.3)',
      },
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 13,
    });
    
    const fit = new FitAddon();
    term.loadAddon(fit);
    
    term.open(terminalRef.current);
    fit.fit();

    termInstance.current = term;
    fitAddon.current = fit;

    if (initialText) {
      term.writeln(initialText);
    }

    if (wsUrl) {
      // Live Mode: Connect to WebSocket and attach
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const attachAddon = new AttachAddon(ws);
      term.loadAddon(attachAddon);

      ws.onopen = () => {
        term.writeln('\x1b[32m[Connected to Live Server]\x1b[0m');
        // Send initial resize
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      };

      ws.onerror = (e) => {
        term.writeln('\r\n\x1b[31m[WebSocket Error] Connection failed to: ' + wsUrl + '\x1b[0m');
        console.error('WebSocket error:', e);
      };

      ws.onclose = (e) => {
        term.writeln(`\r\n\x1b[33m[WebSocket Closed] Code: ${e.code}, Reason: ${e.reason || 'No reason provided'}\x1b[0m`);
      };

      term.onData(() => resetIdleTimer());

    } else {
      // Mock Mode
      term.write('\r\n$ ');

      term.onData(data => {
        resetIdleTimer();
        
        const code = data.charCodeAt(0);
        
        if (code === 13) { // Enter
          const cmd = inputBuffer.current.trim();
          term.write('\r\n');
          if (cmd) {
            onCommand?.(cmd);
          } else {
            term.write('$ ');
          }
          inputBuffer.current = '';
        } else if (code === 127) { // Backspace
          if (inputBuffer.current.length > 0) {
            inputBuffer.current = inputBuffer.current.slice(0, -1);
            term.write('\b \b');
          }
        } else if (code === 3) { // Ctrl+C
          term.write('^C\r\n$ ');
          inputBuffer.current = '';
        } else if (code < 32) {
          // Ignore other control characters for now
        } else {
          inputBuffer.current += data;
          term.write(data);
        }
      });
    }

    const resizeObserver = new ResizeObserver(() => {
      fit.fit();
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    });
    resizeObserver.observe(terminalRef.current);

    resetIdleTimer();

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      resizeObserver.disconnect();
      if (wsRef.current) wsRef.current.close();
      term.dispose();
    };
  }, [wsUrl]); // Re-initialize if wsUrl changes

  return (
    <div ref={terminalRef} style={{ width: '100%', height: '100%', minHeight: 400, overflow: 'hidden', padding: 8, background: '#0d1117', borderRadius: 8 }} />
  );
};
