'use client';

import React from 'react';
import { useScan } from '@/context/ScanContext';
import { DEMO_HOTSPOTS } from '@/lib/demo-data';
import { generateMarkdownReport } from '@/lib/report';
import { generateSarifReport } from '@/lib/sarif';
import { SEVERITY_COLORS } from '@/lib/types';

export function DashboardSummary() {
  const {
    displayedScore,
    findings,
    setSelectedHotspotFile,
    selectedHotspotFile,
    resetToLanding,
    showToast,
  } = useScan();

  // Category counts
  const categoryCounts = {
    security: findings.filter((f) => f.category === 'security').length,
    slop: findings.filter((f) => f.category === 'slop').length,
    gap: findings.filter((f) => f.category === 'gap').length,
    loose_end: findings.filter((f) => f.category === 'loose_end').length,
  };

  const maxCategory = Math.max(
    1,
    categoryCounts.security,
    categoryCounts.slop,
    categoryCounts.gap,
    categoryCounts.loose_end
  );

  // Generate 20-character ASCII bar
  const renderAsciiBar = (count: number) => {
    const totalChars = 20;
    const filled = Math.min(totalChars, Math.round((count / maxCategory) * totalChars));
    const empty = Math.max(0, totalChars - filled);
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  const handleDownloadMd = () => {
    const content = generateMarkdownReport(findings, displayedScore);
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dragnet-audit-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('DOWNLOADED AUDIT REPORT (.MD)');
  };

  const handleDownloadSarif = () => {
    const content = generateSarifReport(findings);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dragnet-audit-${Date.now()}.sarif`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('DOWNLOADED SARIF 2.1.0 ARTIFACT');
  };

  return (
    <div
      className="pointer-events-none fixed z-20 flex flex-col justify-center text-[13px] leading-[1.35] tracking-[.02em] font-mono select-none
        right-6 bottom-6 md:bottom-auto md:top-1/2 md:-translate-y-1/2 
        w-[calc(100vw-48px)] md:w-[320px] lg:w-[380px] md:right-8 lg:right-[90px]"
    >
      <div className="flex flex-col gap-4 text-[#ddd] blend-lighter">
        {/* [health] */}
        <div>
          <h2 className="text-[#aa88ff] font-bold text-[13px] mb-1">[HEALTH]</h2>
          <div className="text-[14px] font-bold text-white mb-1">
            SCORE {displayedScore}/100 — CRITICAL RISKS DETECTED
          </div>
          <p className="text-[#bbb] text-justify text-[11px] leading-[1.4]">
            HALLUCINATED PACKAGES, HARDCODED AWS KEYS AND RAW SQL CONCATENATIONS REQUIRE IMMEDIATE
            REMEDIATION PRIOR TO PRODUCTION DEPLOYMENT.
          </p>
        </div>

        {/* [breakdown] ASCII bars */}
        <div>
          <h2 className="text-[#aa88ff] font-bold text-[13px] mb-1.5">[BREAKDOWN]</h2>
          <div className="flex flex-col gap-1 text-[11px] font-mono">
            <div className="flex items-center justify-between">
              <span className="w-24 text-[#ddd]">SECURITY</span>
              <span className="text-[#FF3B5C] font-semibold font-mono">
                [{renderAsciiBar(categoryCounts.security)}]
              </span>
              <span className="w-5 text-right text-white">{categoryCounts.security}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="w-24 text-[#ddd]">SLOP</span>
              <span className="text-[#FF8A3D] font-semibold font-mono">
                [{renderAsciiBar(categoryCounts.slop)}]
              </span>
              <span className="w-5 text-right text-white">{categoryCounts.slop}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="w-24 text-[#ddd]">GAPS</span>
              <span className="text-[#FFD23D] font-semibold font-mono">
                [{renderAsciiBar(categoryCounts.gap)}]
              </span>
              <span className="w-5 text-right text-white">{categoryCounts.gap}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="w-24 text-[#ddd]">LOOSE ENDS</span>
              <span className="text-[#3DA9FF] font-semibold font-mono">
                [{renderAsciiBar(categoryCounts.loose_end)}]
              </span>
              <span className="w-5 text-right text-white">{categoryCounts.loose_end}</span>
            </div>
          </div>
        </div>

        {/* [hotspots] */}
        <div className="pointer-events-auto">
          <h2 className="text-[#aa88ff] font-bold text-[13px] mb-1.5">[HOTSPOTS]</h2>
          <div className="flex flex-col gap-1 text-[11px]">
            {DEMO_HOTSPOTS.map((hotspot) => {
              const isSelected = selectedHotspotFile === hotspot.file;
              const sevColor = SEVERITY_COLORS[hotspot.severity];

              return (
                <button
                  key={hotspot.file}
                  type="button"
                  onClick={() =>
                    setSelectedHotspotFile(isSelected ? null : hotspot.file)
                  }
                  className={`flex items-center justify-between py-0.5 px-1 text-left transition-colors font-mono cursor-pointer ${
                    isSelected
                      ? 'bg-[#1c1c1c] text-[#aa88ff] border border-[#aa88ff]'
                      : 'hover:text-white text-[#bbb]'
                  }`}
                >
                  <span className="truncate pr-2">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                      style={{ backgroundColor: sevColor }}
                    />
                    {hotspot.file}
                  </span>
                  <span className="text-[#8a8a8a] text-[10px] shrink-0">
                    ({hotspot.count} ISSUES)
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* [export] */}
        <div className="pointer-events-auto pt-1">
          <h2 className="text-[#aa88ff] font-bold text-[13px] mb-1.5">[EXPORT]</h2>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[#ddd] text-[11px]">
            <button
              type="button"
              onClick={handleDownloadMd}
              className="underline hover:text-[#aa88ff] transition-colors cursor-pointer text-left focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#aa88ff]"
            >
              DOWNLOAD REPORT (.MD)
            </button>
            <span className="text-[#8a8a8a]">/</span>
            <button
              type="button"
              onClick={handleDownloadSarif}
              className="underline hover:text-[#aa88ff] transition-colors cursor-pointer text-left focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#aa88ff]"
            >
              DOWNLOAD SARIF
            </button>
            <span className="text-[#8a8a8a]">/</span>
            <button
              type="button"
              onClick={resetToLanding}
              className="underline hover:text-[#aa88ff] transition-colors cursor-pointer text-left focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#aa88ff]"
            >
              NEW SCAN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
