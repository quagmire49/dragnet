import type { Metadata } from 'next';
import './globals.css';
import { ScanProvider } from '@/context/ScanContext';
import { ParticleField } from '@/components/ParticleField';
import { BrandHeader } from '@/components/BrandHeader';
import { TagsRow } from '@/components/TagsRow';
import { FindingDrawer } from '@/components/FindingDrawer';
import { CommandPalette } from '@/components/CommandPalette';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Toast } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'DRAGNET — CODE AUDIT AGENT',
  description: 'Architecture-agnostic code auditor agent: security holes, AI slop, coding gaps and loose ends.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-[#ddd] overflow-hidden antialiased select-none">
        <ScanProvider>
          {/* Offline Mode Banner */}
          <OfflineBanner />

          {/* Persistent Background Particle Cloud */}
          <ParticleField />

          {/* Fixed UI Shell */}
          <div className="ui-layer">
            {/* Top Brand & Counter */}
            <BrandHeader />

            {/* Tags row */}
            <TagsRow />

            {/* Dynamic Screen Content */}
            {children}

            {/* Finding Detail Drawer (Slides from right) */}
            <FindingDrawer />

            {/* Command Palette */}
            <CommandPalette />

            {/* Global Toasts */}
            <Toast />
          </div>
        </ScanProvider>
      </body>
    </html>
  );
}
