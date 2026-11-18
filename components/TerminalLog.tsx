'use client';

import React, { useEffect, useRef } from 'react';
import { useScan } from '@/context/ScanContext';
import { DEMO_LANGUAGES } from '@/lib/demo-data';

export function TerminalLog() {
  const { logs, status } = useScan();
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const currentStage = logs.length > 0 ? logs[logs.length - 1].stage : 'idle';

  return (
    <div
      className="pointer-events-none fixed z-20 flex flex-col justify-center text-[13px] leading-[1.35] tracking-[.02em] font-mono select-none
        right-6 bottom-6 md:bottom-auto md:top-1/2 md:-translate-y-1/2 
        w-[calc(100vw-48px)] md:w-[320px] lg:w-[380px] md:right-8 lg:right-[90px]"
    >
      <div className="flex flex-col gap-4 text-[#ddd] blend-lighter">
        {/* [stage] */}
        <div>
          <h2 className="text-[#aa88ff] font-bold text-[13px] mb-1">[STAGE]</h2>
          <div className="flex items-center gap-2 text-white">
            <span className="text-[#aa88ff] animate-pulse">●</span>
            <span className="font-semibold">{currentStage.toUpperCase()}</span>
            <span className="text-[#8a8a8a] text-[11px]">
              {status === 'scanning' ? 'IN PROGRESS..' : 'COMPLETED'}
            </span>
          </div>
        </div>

        {/* [log] */}
        <div>
          <h2 className="text-[#aa88ff] font-bold text-[13px] mb-1">[LOG]</h2>
          <div
            ref={logContainerRef}
            className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto no-scrollbar font-mono text-[11px] leading-[1.3] text-[#bbb]"
          >
            {logs.map((log) => {
              const isWarn = log.status === 'WARN';
              return (
                <div key={log.id} className="flex items-start gap-2">
                  <span
                    className={
                      isWarn
                        ? 'text-[#FF3B5C] font-bold'
                        : log.status === 'OK'
                        ? 'text-[#aa88ff]'
                        : 'text-[#8a8a8a]'
                    }
                  >
                    [{log.status}]
                  </span>
                  <div className="flex-1 truncate">
                    <span className={isWarn ? 'text-white' : 'text-[#ddd]'}>{log.message}</span>
                    {log.detail && (
                      <span className="text-[#8a8a8a] ml-1">({log.detail})</span>
                    )}
                  </div>
                </div>
              );
            })}
            {status === 'scanning' && (
              <div className="text-[#aa88ff] animate-pulse">_ STREAMING AST BUS..</div>
            )}
          </div>
        </div>

        {/* [languages] */}
        <div>
          <h2 className="text-[#aa88ff] font-bold text-[13px] mb-1">[LANGUAGES]</h2>
          <div className="flex flex-col gap-1 text-[11px] text-[#bbb]">
            {DEMO_LANGUAGES.map((lang) => (
              <div key={lang.name} className="flex items-center justify-between">
                <span>{lang.name}</span>
                <span className="text-[#8a8a8a]">
                  {lang.percentage}% ({lang.files} FILES)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
