'use client';

import React from 'react';
import { useScan } from '@/context/ScanContext';

export function OfflineBanner() {
  const { isOffline } = useScan();

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-[#2a2a2a] text-[#8a8a8a] text-[11px] py-1 px-4 text-center tracking-[.02em] uppercase select-none"
    >
      <span className="text-[#aa88ff] mr-2">●</span>
      OFFLINE REPLAY MODE ACTIVE — AUDITING VIA CACHED LOCAL AST & DEPENDENCY REPLAYS
    </div>
  );
}
