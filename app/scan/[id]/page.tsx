'use client';

import React from 'react';
import { useScan } from '@/context/ScanContext';
import { LiveFeedCards } from '@/components/LiveFeedCards';
import { TerminalLog } from '@/components/TerminalLog';
import { DashboardSummary } from '@/components/DashboardSummary';

export default function ScanPage() {
  const { status } = useScan();

  return (
    <>
      {/* Left List: Findings feed (live during scan, searchable & sortable on dashboard) */}
      <LiveFeedCards />

      {/* Right Column: Terminal log during scan, or Dashboard summary when done */}
      {status === 'scanning' ? <TerminalLog /> : <DashboardSummary />}
    </>
  );
}
