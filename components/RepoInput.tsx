'use client';

import React, { useState } from 'react';
import { useScan } from '@/context/ScanContext';

export function RepoInput() {
  const { startScan, isDryingDolly } = useScan();
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startScan(url.trim() || undefined);
  };

  return (
    <div
      className={`pointer-events-auto fixed left-1/2 -translate-x-1/2 bottom-[26%] w-[90%] max-w-[580px] z-20 transition-opacity duration-500 ${
        isDryingDolly ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <form onSubmit={handleSubmit} className="relative w-full">
        <label htmlFor="repo-url-input" className="sr-only">
          Repository URL to audit
        </label>
        <input
          id="repo-url-input"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="PASTE A REPO URL AND PRESS ENTER"
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-transparent text-white placeholder-[#777] font-mono text-[13px] tracking-[.02em] uppercase py-2 px-1 focus:outline-none border-b border-[#aa88ff] caret-[#aa88ff] select-auto transition-colors focus:border-white"
        />
        <div className="flex items-center justify-between text-[10px] text-[#8a8a8a] mt-2 font-mono">
          <span>PRESS ENTER TO AUDIT</span>
          <span>OR CLICK A DEMO CARD TO REPLAY</span>
        </div>
      </form>
    </div>
  );
}
