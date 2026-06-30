'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export interface TerminalClientRef {
  write: (data: string) => void;
  writeln: (data: string) => void;
  prompt: () => void;
  clear: () => void;
}

interface TerminalClientProps {
  onCommand: (cmd: string) => void;
  onIdleTimeout: () => void;
  idleTimeoutMs?: number;
  initialText?: string;
  innerRef?: React.Ref<TerminalClientRef>;
}

export const TerminalClient = ({ onCommand, onIdleTimeout, idleTimeoutMs = 300000, initialText, innerRef }: TerminalClientProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const inputBuffer = useRef<string>('');
  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      onIdleTimeout();
    }, idleTimeoutMs);
  };

  useImperativeHandle(innerRef, () => ({
    write: (data: string) => {
      termInstance.current?.write(data.replace(/\n/g, '\r\n'));
    },
    writeln: (data: string) => {
      termInstance.current?.writeln(data.replace(/\n/g, '\r\n'));
    },
    prompt: () => {
      termInstance.current?.write('\r\n$ ');
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
    
    term.write('\r\n$ ');

    term.onData(data => {
      resetIdleTimer();
      
      const code = data.charCodeAt(0);
      
      if (code === 13) { // Enter
        const cmd = inputBuffer.current.trim();
        term.write('\r\n');
        if (cmd) {
          onCommand(cmd);
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

    const resizeObserver = new ResizeObserver(() => {
      fit.fit();
    });
    resizeObserver.observe(terminalRef.current);

    resetIdleTimer();

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      resizeObserver.disconnect();
      term.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={terminalRef} style={{ width: '100%', height: '100%', minHeight: 400, overflow: 'hidden', padding: 8, background: '#0d1117', borderRadius: 8 }} />
  );
};
