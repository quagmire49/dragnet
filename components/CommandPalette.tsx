'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useScan } from '@/context/ScanContext';
import { generateMarkdownReport } from '@/lib/report';
import { generateSarifReport } from '@/lib/sarif';

export function CommandPalette() {
  const {
    isCmdKOpen,
    setIsCmdKOpen,
    startScan,
    resetToLanding,
    findings,
    displayedScore,
    setActiveFinding,
    toggleTag,
    showToast,
  } = useScan();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdKOpen(!isCmdKOpen);
      } else if (e.key === 'Escape' && isCmdKOpen) {
        setIsCmdKOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCmdKOpen, setIsCmdKOpen]);

  useEffect(() => {
    if (isCmdKOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setSearch('');
    }
  }, [isCmdKOpen]);

  const actions = [
    {
      id: 'cmd-audit',
      title: 'RUN DEMO CODEBASE AUDIT',
      category: 'AUDIT',
      run: () => {
        startScan();
        setIsCmdKOpen(false);
      },
    },
    {
      id: 'cmd-hallucinated',
      title: 'INSPECT HALLUCINATED PACKAGE (SLOPSQUATTING RISK)',
      category: 'SECURITY',
      run: () => {
        const h = findings.find((f) => f.rule === 'hallucinated-import');
        if (h) setActiveFinding(h);
        else startScan();
        setIsCmdKOpen(false);
      },
    },
    {
      id: 'cmd-secrets',
      title: 'FILTER BY SECURITY & EXPOSED SECRETS',
      category: 'FILTER',
      run: () => {
        toggleTag('SECURITY');
        setIsCmdKOpen(false);
      },
    },
    {
      id: 'cmd-export-md',
      title: 'DOWNLOAD MARKDOWN REPORT (.MD)',
      category: 'EXPORT',
      run: () => {
        const content = generateMarkdownReport(findings, displayedScore);
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dragnet-report.md`;
        a.click();
        URL.revokeObjectURL(url);
        setIsCmdKOpen(false);
        showToast('REPORT DOWNLOADED');
      },
    },
    {
      id: 'cmd-export-sarif',
      title: 'DOWNLOAD SARIF 2.1.0 ARTIFACT',
      category: 'EXPORT',
      run: () => {
        const content = generateSarifReport(findings);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dragnet-audit.sarif`;
        a.click();
        URL.revokeObjectURL(url);
        setIsCmdKOpen(false);
        showToast('SARIF DOWNLOADED');
      },
    },
    {
      id: 'cmd-home',
      title: 'RETURN TO HOME / NEW SCAN',
      category: 'NAV',
      run: () => {
        resetToLanding();
        setIsCmdKOpen(false);
      },
    },
  ];

  const filteredActions = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDownInMenu = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredActions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].run();
      }
    }
  };

  if (!isCmdKOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/70 backdrop-blur-none pointer-events-auto select-none"
      onClick={() => setIsCmdKOpen(false)}
    >
      <div
        className="w-full max-w-[540px] bg-[#0a0a0a] border border-[#2a2a2a] p-3 font-mono text-[13px] tracking-[.02em] shadow-2xl flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDownInMenu}
      >
        {/* Search header */}
        <div className="flex items-center gap-2 border-b border-[#2a2a2a] pb-2">
          <span className="text-[#aa88ff] text-[14px]">›</span>
          <label htmlFor="command-palette-search" className="sr-only">
            Type command or target
          </label>
          <input
            id="command-palette-search"
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="TYPE COMMAND OR TARGET (ESC TO CLOSE)"
            className="flex-1 bg-transparent text-white placeholder-[#666] font-mono text-[12px] uppercase focus:outline-none"
          />
          <kbd className="text-[10px] text-[#8a8a8a] bg-[#1c1c1c] border border-[#2a2a2a] px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto no-scrollbar pt-1">
          {filteredActions.length === 0 && (
            <div className="py-4 text-center text-[#8a8a8a] text-[11px]">
              NO MATCHING COMMANDS FOUND
            </div>
          )}

          {filteredActions.map((action, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={action.id}
                type="button"
                onClick={action.run}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between p-2 text-left font-mono text-[11px] uppercase transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#1a1426] border border-[#aa88ff] text-[#aa88ff]'
                    : 'text-[#ddd] hover:text-white border border-transparent'
                }`}
              >
                <span>{action.title}</span>
                <span className="text-[9px] text-[#8a8a8a] bg-[#141414] px-1 py-0.5 border border-[#222]">
                  {action.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
