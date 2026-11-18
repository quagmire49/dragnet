'use client';

import React from 'react';
import { HEADLINE_FINDINGS } from '@/lib/demo-data';
import { useScan } from '@/context/ScanContext';
import { SEVERITY_COLORS } from '@/lib/types';

export function LandingCards() {
  const { startScan } = useScan();

  const renderCodeSnippetThumb = (rule: string, snippet: string) => {
    const lines = snippet.split('\n').slice(0, 5);

    return (
      <div className="h-[150px] w-full bg-[#070707] p-3 font-mono text-[11px] leading-[1.35] text-[#ddd] overflow-hidden select-none border-b border-[#222]">
        <div className="text-[9px] text-[#8a8a8a] mb-1.5 tracking-wider opacity-70">
          // REPOSITORY AST SNIPPET
        </div>
        {lines.map((line, idx) => {
          let lineContent: React.ReactNode = line;

          if (line.includes('import fastjson_utils_pro')) {
            lineContent = (
              <>
                <span className="text-[#aa88ff]">import</span>{' '}
                <span className="text-[#FF3B5C] font-semibold underline decoration-wavy">
                  fastjson_utils_pro
                </span>{' '}
                <span className="text-[#aa88ff]">as</span> fjson
              </>
            );
          } else if (line.includes('AWS_SECRET_ACCESS_KEY')) {
            lineContent = (
              <>
                <span className="text-[#FF8A3D]">AWS_SECRET_ACCESS_KEY</span> ={' '}
                <span className="text-[#FF3B5C]">"wJalrXUtnFEM..."</span>
              </>
            );
          } else if (line.includes('cursor.execute')) {
            lineContent = (
              <>
                <span className="text-[#aa88ff]">cursor</span>.execute(
                <span className="text-[#FF8A3D]">query</span>)
              </>
            );
          } else if (line.includes('SELECT')) {
            lineContent = (
              <>
                query = <span className="text-[#cfe8c0]">f"SELECT * FROM users..."</span>
              </>
            );
          } else if (line.includes('except Exception')) {
            lineContent = (
              <>
                <span className="text-[#aa88ff]">except</span>{' '}
                <span className="text-[#FFD23D]">Exception</span>:
              </>
            );
          } else if (line.trim() === 'pass') {
            lineContent = <span className="text-[#FF3B5C] font-bold">    pass</span>;
          }

          return (
            <div key={idx} className="truncate">
              <span className="inline-block w-5 text-[#444] select-none text-[10px]">
                {idx + 1}
              </span>
              {lineContent}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="pointer-events-auto fixed top-[210px] left-6 w-[350px] lg:w-[390px] hidden md:flex flex-col gap-4 z-20 max-h-[calc(100vh-230px)] overflow-y-auto no-scrollbar pb-16 select-none"
      role="region"
      aria-label="Headline audit findings"
    >
      <div className="text-[10px] tracking-[.04em] text-[#8a8a8a] uppercase px-1">
        HEADLINE AUDIT TARGETS — CLICK TO AUDIT
      </div>

      {HEADLINE_FINDINGS.map((finding) => {
        const severityColor = SEVERITY_COLORS[finding.severity];

        return (
          <button
            key={finding.id}
            type="button"
            onClick={() => startScan()}
            className="w-full text-left bg-[#0a0a0a] border border-[#2a2a2a] hover:border-[#aa88ff] transition-all group focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#aa88ff] focus-visible:outline-offset-2 shadow-lg"
            style={{
              borderLeftWidth: '3px',
              borderLeftColor: severityColor,
            }}
          >
            {/* Syntax snippet preview */}
            {renderCodeSnippetThumb(finding.rule, finding.snippet)}

            {/* Spacious metadata footer */}
            <div className="p-3.5 flex flex-col gap-1.5 text-[11px] font-mono leading-tight bg-[#0a0a0a]">
              {/* Line 1: Rule name & severity badge */}
              <div className="flex items-center justify-between">
                <span className="text-white group-hover:text-[#aa88ff] transition-colors truncate pr-2 font-bold text-[12px]">
                  {finding.rule}
                </span>
                <span
                  className="text-[10px] font-mono tracking-wider flex items-center gap-1.5 shrink-0 uppercase font-semibold"
                  style={{ color: severityColor }}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: severityColor }}
                  />
                  {finding.severity}
                </span>
              </div>

              {/* Line 2: File path & category */}
              <div className="flex items-center justify-between text-[#8a8a8a] text-[10px]">
                <span className="text-[#ccc] truncate pr-2">{finding.file}</span>
                <span className="shrink-0 uppercase bg-[#141414] px-1.5 py-0.5 border border-[#222]">
                  {finding.category}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
