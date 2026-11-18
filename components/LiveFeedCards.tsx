'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useScan } from '@/context/ScanContext';
import { SEVERITY_COLORS } from '@/lib/types';

export function LiveFeedCards() {
  const {
    visibleFindings,
    activeFinding,
    setActiveFinding,
    status,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    appliedFixIds,
    selectedHotspotFile,
    setSelectedHotspotFile,
  } = useScan();

  const [focusedIndex, setFocusedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard navigation: j/k, Enter, /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (document.activeElement?.tagName === 'INPUT') {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, visibleFindings.length - 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (visibleFindings[focusedIndex]) {
          setActiveFinding(visibleFindings[focusedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visibleFindings, focusedIndex, setActiveFinding]);

  return (
    <div
      className="pointer-events-auto fixed top-[180px] left-6 w-[320px] hidden md:flex flex-col gap-2.5 z-20 max-h-[calc(100vh-200px)] overflow-hidden select-none"
      role="region"
      aria-label="Audit findings feed"
    >
      {/* Screen 3 Sort & Search Row */}
      {status === 'done' && (
        <div className="flex flex-col gap-2 pb-1">
          {/* Search box */}
          <div className="relative">
            <label htmlFor="feed-search-input" className="sr-only">
              Search findings
            </label>
            <input
              id="feed-search-input"
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH FINDINGS ( / )"
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#ddd] placeholder-[#666] text-[11px] font-mono px-2 py-1.5 focus:outline-none focus:border-[#aa88ff] uppercase tracking-[.02em]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1.5 text-[#8a8a8a] hover:text-white text-[10px]"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Sort Chip Row */}
          <div className="flex items-center justify-between text-[10px] text-[#8a8a8a]">
            <span>SORT:</span>
            <div className="flex items-center gap-1">
              {(['risk', 'file', 'category'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSortBy(s)}
                  className={`px-1.5 py-0.5 uppercase font-mono border ${
                    sortBy === s
                      ? 'border-[#aa88ff] text-[#aa88ff] bg-[#1c1c1c]'
                      : 'border-[#2a2a2a] text-[#8a8a8a] hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Hotspot filter active indicator */}
          {selectedHotspotFile && (
            <div className="flex items-center justify-between bg-[#1c1c1c] border border-[#aa88ff] px-2 py-1 text-[10px] text-[#aa88ff]">
              <span className="truncate">FILTER: {selectedHotspotFile}</span>
              <button
                type="button"
                onClick={() => setSelectedHotspotFile(null)}
                className="hover:text-white underline ml-2"
              >
                RESET
              </button>
            </div>
          )}
        </div>
      )}

      {/* Feed List Header */}
      <div className="flex items-center justify-between text-[10px] text-[#8a8a8a] tracking-[.04em] px-1 uppercase">
        <span>
          {status === 'scanning' ? 'LIVE FINDINGS STREAM' : 'VERIFIED FINDINGS'} (
          {visibleFindings.length})
        </span>
        <span className="text-[9px]">J/K NAV • ↵ OPEN</span>
      </div>

      {/* Scrollable list */}
      <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pb-8 pr-1">
        {visibleFindings.length === 0 && (
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] p-3 text-[11px] text-[#8a8a8a] text-center">
            {status === 'scanning' ? 'AUDITING REPO AST...' : 'NO FINDINGS MATCH FILTER'}
          </div>
        )}

        {visibleFindings.map((finding, index) => {
          const isFocused = index === focusedIndex;
          const isSelected = activeFinding?.id === finding.id;
          const severityColor = SEVERITY_COLORS[finding.severity];
          const isApplied = appliedFixIds.has(finding.id);

          return (
            <button
              key={finding.id}
              type="button"
              onClick={() => {
                setFocusedIndex(index);
                setActiveFinding(finding);
              }}
              className={`w-full text-left bg-[#0a0a0a] border border-[#2a2a2a] p-2.5 transition-all cursor-pointer font-mono select-none relative
                ${isSelected ? 'border-[#aa88ff] bg-[#141418]' : 'hover:border-[#444]'}
                ${isFocused ? 'ring-1 ring-[#aa88ff]' : ''}
              `}
              style={{
                borderLeftWidth: '2px',
                borderLeftColor: severityColor,
                animation: 'fadeSlideIn 250ms ease-out both',
                animationDelay: `${Math.min(index * 40, 400)}ms`,
              }}
            >
              {/* Line 1: Left rule, right severity dot + word */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-white text-[11px] font-semibold truncate pr-2">
                  {finding.rule}
                </span>
                <span
                  className="text-[10px] font-mono tracking-wider flex items-center gap-1 shrink-0"
                  style={{ color: severityColor }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block"
                    style={{ backgroundColor: severityColor }}
                  />
                  {finding.severity}
                </span>
              </div>

              {/* Title summary */}
              <div className="text-[11px] text-[#ddd] truncate mb-1 opacity-90">
                {finding.title}
              </div>

              {/* Line 2: File:line and category */}
              <div className="flex items-center justify-between text-[#8a8a8a] text-[10px]">
                <span className="truncate pr-2">
                  {finding.file}:{finding.line_start}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isApplied && <span className="text-[#cfe8c0] text-[9px]">[FIXED]</span>}
                  <span className="uppercase">{finding.category}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
