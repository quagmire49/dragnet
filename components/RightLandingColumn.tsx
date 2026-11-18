'use client';

import React from 'react';
import { useScan } from '@/context/ScanContext';

export function RightLandingColumn() {
  const { startScan } = useScan();

  return (
    <div
      className="pointer-events-none fixed z-20 flex flex-col justify-center text-[13px] leading-[1.35] tracking-[.02em] font-mono select-none
        right-6 bottom-6 md:bottom-auto md:top-1/2 md:-translate-y-1/2 
        w-[calc(100vw-48px)] md:w-[320px] lg:w-[380px] md:right-8 lg:right-[90px]"
    >
      <div className="flex flex-col gap-5 text-[#ddd] blend-lighter">
        {/* [info] */}
        <div>
          <h2 className="text-[#aa88ff] font-bold text-[13px] mb-1.5">[INFO]</h2>
          <p className="text-[#ddd] text-justify">
            SCANS RUN ON A READ-ONLY CLONE. NOTHING IS EXECUTED.
          </p>
        </div>

        {/* [aims] */}
        <div>
          <h2 className="text-[#aa88ff] font-bold text-[13px] mb-1.5">[AIMS]</h2>
          <p className="text-[#ddd] text-justify">
            PASTE ANY REPO, ANY LANGUAGE. DRAGNET SWEEPS FOR SECURITY HOLES, AI SLOP, CODING GAPS
            AND LOOSE ENDS, THEN WRITES THE FIX.
          </p>
        </div>

        {/* [exploring] */}
        <div>
          <h2 className="text-[#aa88ff] font-bold text-[13px] mb-1.5">[EXPLORING]</h2>
          <p className="text-[#ddd] text-justify">
            HALLUCINATED PACKAGES / SECRET LEAKS / INJECTION PATHS / DEAD AND STUBBED CODE
          </p>
        </div>

        {/* [connect] */}
        <div className="pointer-events-auto">
          <h2 className="text-[#aa88ff] font-bold text-[13px] mb-1.5">[CONNECT]</h2>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[#ddd]">
            <button
              type="button"
              onClick={() => startScan()}
              className="underline hover:text-[#aa88ff] transition-colors cursor-pointer text-left focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#aa88ff]"
            >
              TRY THE DEMO REPO
            </button>
            <span className="text-[#8a8a8a]">/</span>
            <a
              href="https://github.com/quagmire49"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-[#aa88ff] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#aa88ff]"
            >
              DOCS
            </a>
            <span className="text-[#8a8a8a]">/</span>
            <a
              href="https://github.com/quagmire49"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-[#aa88ff] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#aa88ff]"
            >
              GITHUB
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
