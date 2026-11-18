'use client';

import React, { useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useScan } from '@/context/ScanContext';
import { SEVERITY_COLORS } from '@/lib/types';

// Dynamically import diff viewer to prevent SSR issues
const ReactDiffViewer = dynamic(() => import('react-diff-viewer-continued'), {
  ssr: false,
  loading: () => <div className="p-3 text-[11px] text-[#8a8a8a]">LOADING DIFF VIEWER...</div>,
});

export function FindingDrawer() {
  const {
    activeFinding,
    setActiveFinding,
    applyFix,
    appliedFixIds,
    showToast,
    triggerRingFlash,
  } = useScan();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeFinding) {
        setActiveFinding(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFinding, setActiveFinding]);

  // Trigger ring flash if hallucinated package is opened
  useEffect(() => {
    if (activeFinding?.isHallucinated || activeFinding?.rule === 'hallucinated-import') {
      triggerRingFlash();
    }
  }, [activeFinding, triggerRingFlash]);

  // Extract old and new code from unified diff
  const { oldCode, newCode } = useMemo(() => {
    if (!activeFinding?.fix_diff) return { oldCode: '', newCode: '' };

    const lines = activeFinding.fix_diff.split('\n');
    const oldLines: string[] = [];
    const newLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@')) {
        continue;
      }
      if (line.startsWith('-')) {
        oldLines.push(line.substring(1));
      } else if (line.startsWith('+')) {
        newLines.push(line.substring(1));
      } else {
        const clean = line.startsWith(' ') ? line.substring(1) : line;
        oldLines.push(clean);
        newLines.push(clean);
      }
    }

    return { oldCode: oldLines.join('\n'), newCode: newLines.join('\n') };
  }, [activeFinding?.fix_diff]);

  if (!activeFinding) return null;

  const severityColor = SEVERITY_COLORS[activeFinding.severity];
  const isApplied = appliedFixIds.has(activeFinding.id);
  const isHallucinated =
    activeFinding.isHallucinated || activeFinding.rule === 'hallucinated-import';

  // Confidence 10-char bar: e.g. [█████████░] 0.98
  const confFilled = Math.min(10, Math.round(activeFinding.confidence * 10));
  const confBar = '█'.repeat(confFilled) + '░'.repeat(10 - confFilled);

  const handleCopyPatch = () => {
    if (activeFinding.fix_diff && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(activeFinding.fix_diff);
      showToast('PATCH COPIED TO CLIPBOARD');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Finding details: ${activeFinding.rule}`}
      className="pointer-events-auto fixed top-0 bottom-0 right-0 z-40 bg-[#0a0a0a] border-l border-[#2a2a2a] flex flex-col font-mono text-[13px] leading-[1.35] tracking-[.02em] select-none
        w-full md:w-[540px] lg:w-[620px] transition-transform duration-300 ease-out shadow-2xl"
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a] bg-[#0a0a0a]">
        <div className="flex items-center gap-2 truncate pr-2">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
            style={{ backgroundColor: severityColor }}
          />
          <span className="text-white font-bold text-[14px] truncate">
            {activeFinding.rule}
          </span>
          <span
            className="text-[11px] font-mono tracking-wider shrink-0"
            style={{ color: severityColor }}
          >
            [{activeFinding.severity.toUpperCase()}]
          </span>
        </div>

        <button
          type="button"
          onClick={() => setActiveFinding(null)}
          className="text-[#8a8a8a] hover:text-white border border-[#2a2a2a] hover:border-[#aa88ff] px-2.5 py-1 text-[11px] font-mono uppercase transition-colors"
          aria-label="Close finding detail"
        >
          CLOSE [ESC]
        </button>
      </div>

      {/* Drawer Body (Scrollable) */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-5 flex flex-col gap-5">
        {/* Hallucinated Package Alert */}
        {isHallucinated && (
          <div className="bg-[#140b12] border-2 border-[#FF3B5C] p-3 text-[#FF3B5C] text-[12px] font-bold tracking-[.03em] flex items-start gap-2.5 animate-pulse">
            <span className="text-[16px] leading-none">⚠</span>
            <div>
              PACKAGE DOES NOT EXIST ON NPM/PYPI. SLOPSQUATTING RISK.
              <div className="text-[10px] text-[#ddd] font-normal mt-1">
                ATTACKERS CAN REGISTER THIS ORPHANED IDENTIFIER ON THE PUBLIC REGISTRY TO EXECUTE REMOTE CODE.
              </div>
            </div>
          </div>
        )}

        {/* Confidence & Target Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] bg-[#111] p-3 border border-[#2a2a2a]">
          <div>
            <div className="text-[#8a8a8a] text-[10px] mb-0.5">LOCATION</div>
            <div className="text-white font-semibold truncate">
              {activeFinding.file}:{activeFinding.line_start}
            </div>
          </div>
          <div>
            <div className="text-[#8a8a8a] text-[10px] mb-0.5">CONFIDENCE SCORE</div>
            <div className="text-[#aa88ff] font-mono">
              [{confBar}] {activeFinding.confidence.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Highlighted Code Snippet with #aa88ff left rule */}
        <div>
          <div className="text-[#8a8a8a] text-[11px] mb-1.5 flex items-center justify-between">
            <span>OFFENDING REPO AST</span>
            <span className="text-[#666] text-[10px]">{activeFinding.source.toUpperCase()} ENGINE</span>
          </div>
          <div className="bg-[#050505] border border-[#2a2a2a] p-3 overflow-x-auto font-mono text-[11px] leading-[1.4] text-[#ddd]">
            {activeFinding.snippet.split('\n').map((line, idx) => (
              <div key={idx} className="flex items-start border-l-2 border-[#aa88ff] pl-3 py-0.5">
                <span className="w-8 text-[#555] select-none text-[10px] shrink-0">
                  {activeFinding.line_start + idx}
                </span>
                <span className="text-white">{line}</span>
              </div>
            ))}
          </div>
        </div>

        {/* [why this matters] */}
        <div>
          <h3 className="text-[#aa88ff] font-bold text-[12px] mb-1.5">[WHY THIS MATTERS]</h3>
          <p className="text-[#ccc] text-justify text-[12px] leading-[1.45] bg-[#0c0c0c] p-3 border border-[#2a2a2a]">
            {activeFinding.explanation}
          </p>
        </div>

        {/* Side-by-Side Diff */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-[#8a8a8a] mb-1.5">
            <span>SYNTHESIZED REMEDIATION PATCH</span>
            <span className="text-[#cfe8c0] text-[10px]">
              {isApplied ? '✓ PATCH MERGED IN WORKSPACE' : 'AI REMEDIATION READY'}
            </span>
          </div>

          {activeFinding.fix_diff ? (
            <div className="border border-[#2a2a2a] bg-[#000] overflow-hidden text-[11px]">
              <ReactDiffViewer
                oldValue={oldCode}
                newValue={newCode}
                splitView={true}
                useDarkTheme={true}
                hideLineNumbers={false}
                styles={{
                  variables: {
                    dark: {
                      diffViewerBackground: '#000000',
                      diffViewerColor: '#dddddd',
                      addedBackground: '#0f1a0b',
                      addedColor: '#cfe8c0',
                      removedBackground: '#1a0b0f',
                      removedColor: '#ffb3bf',
                      wordAddedBackground: '#193313',
                      wordRemovedBackground: '#331319',
                      gutterColor: '#555555',
                      gutterBackground: '#0a0a0a',
                    },
                  },
                  line: {
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontFamily: '"SF Mono", Menlo, Consolas, monospace',
                  },
                }}
              />
            </div>
          ) : (
            <div className="bg-[#0c0c0c] border border-[#2a2a2a] p-3 text-[11px] text-[#8a8a8a] text-center">
              NO AUTOMATED REMEDIATION PATCH. RESOLVE STUB MANUALLY IN CODEBASE.
            </div>
          )}
        </div>
      </div>

      {/* Drawer Action Buttons (Chips) */}
      <div className="p-4 border-t border-[#2a2a2a] bg-[#0a0a0a] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {activeFinding.fix_diff && (
            <>
              <button
                type="button"
                onClick={() => applyFix(activeFinding.id)}
                className={`px-3 py-1.5 font-mono text-[11px] tracking-[.02em] uppercase border transition-all cursor-pointer ${
                  isApplied
                    ? 'border-[#cfe8c0] text-[#cfe8c0] bg-[#0f1a0b]'
                    : 'border-[#aa88ff] text-black bg-[#aa88ff] hover:bg-white hover:border-white'
                } focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#aa88ff]`}
              >
                {isApplied ? '✓ PATCH APPLIED' : 'APPLY FIX'}
              </button>

              <button
                type="button"
                onClick={handleCopyPatch}
                className="px-3 py-1.5 font-mono text-[11px] tracking-[.02em] uppercase border border-[#2a2a2a] text-[#ddd] bg-[#1c1c1c] hover:border-[#aa88ff] hover:text-[#aa88ff] transition-all cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#aa88ff]"
              >
                COPY PATCH
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setActiveFinding(null)}
          className="px-3 py-1.5 font-mono text-[11px] tracking-[.02em] uppercase border border-[#2a2a2a] text-[#8a8a8a] bg-[#1c1c1c] hover:border-[#555] hover:text-white transition-all cursor-pointer focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#aa88ff]"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
