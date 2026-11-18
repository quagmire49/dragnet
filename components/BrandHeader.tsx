'use client';

import React from 'react';
import { useScan } from '@/context/ScanContext';

export function BrandHeader() {
  const { status, findings, displayedScore, resetToLanding } = useScan();

  // Score color shift from #FF3B5C (low score) to #aa88ff (mid) to #ffffff (high)
  const getScoreColor = (score: number) => {
    if (score < 40) return '#FF3B5C'; // critical / low health
    if (score < 75) return '#aa88ff'; // mid
    return '#ffffff'; // high
  };

  // Determine counter text
  let counterText = '00';
  let counterColor = '#8a8a8a';

  if (status === 'idle') {
    counterText = '00';
    counterColor = '#8a8a8a';
  } else if (status === 'scanning') {
    counterText = findings.length.toString().padStart(2, '0');
    counterColor = '#aa88ff';
  } else if (status === 'done') {
    counterText = displayedScore.toString().padStart(2, '0');
    counterColor = getScoreColor(displayedScore);
  }

  return (
    <>
      {/* Top Left Brand */}
      <div
        onClick={resetToLanding}
        className="pointer-events-auto fixed top-6 left-6 z-30 flex items-center gap-3 cursor-pointer group select-none"
        role="button"
        tabIndex={0}
        aria-label="Dragnet home"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') resetToLanding();
        }}
      >
        {/* 40x40 SVG Reticle / Radar Mark */}
        <div className="w-10 h-10 border border-[#2a2a2a] bg-[#0a0a0a] flex items-center justify-center group-hover:border-[#aa88ff] transition-colors">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#aa88ff"
            strokeWidth="1.5"
            strokeLinecap="square"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" stroke="#2a2a2a" />
            <circle cx="12" cy="12" r="5" stroke="#aa88ff" strokeDasharray="2 2" />
            <line x1="12" y1="3" x2="12" y2="21" stroke="#2a2a2a" />
            <line x1="3" y1="12" x2="21" y2="12" stroke="#2a2a2a" />
            <circle cx="15" cy="9" r="1.5" fill="#FF3B5C" stroke="none" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex flex-col">
          <span className="text-[20px] font-bold tracking-[.02em] text-white leading-tight">
            DRAGNET
          </span>
          <span className="text-[11px] text-[#8a8a8a] tracking-[.02em] leading-none">
            CODE AUDIT AGENT
          </span>
        </div>
      </div>

      {/* Top Right 44x44 Counter */}
      <div
        className="pointer-events-auto fixed top-6 right-6 md:right-8 z-30 w-11 h-11 rounded-full border border-[#2a2a2a] bg-[#0a0a0a] flex items-center justify-center font-mono text-[13px] tracking-[.02em] transition-colors shadow-none select-none"
        style={{ color: counterColor }}
        title={
          status === 'idle'
            ? 'Idle counter'
            : status === 'scanning'
            ? 'Live finding count'
            : `Health score: ${displayedScore}/100`
        }
        aria-label={
          status === 'idle'
            ? 'Idle counter 00'
            : status === 'scanning'
            ? `Findings count: ${counterText}`
            : `Health score: ${counterText}`
        }
      >
        {counterText}
      </div>
    </>
  );
}
