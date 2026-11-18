'use client';

import React from 'react';
import { useScan } from '@/context/ScanContext';

export function Toast() {
  const { toastMessage } = useScan();

  if (!toastMessage) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0a0a0a] border border-[#aa88ff] text-[#aa88ff] text-[11px] font-mono py-1.5 px-3 uppercase tracking-[.02em] select-none shadow-lg animate-fadeSlideIn"
    >
      <span className="text-white mr-1.5">✓</span>
      {toastMessage}
    </div>
  );
}
