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
  description:
    'Architecture-agnostic code auditor agent: security holes, AI slop, coding gaps and loose ends.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-black">
      <head>
        {/* Critical inline CSS to guarantee pure black background and monospace styling instantly */}
        <style dangerouslySetInnerHTML={{ __html: `
          html, body {
            background-color: #000000 !important;
            color: #dddddd !important;
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            font-family: "SF Mono", "Menlo", "Consolas", "Liberation Mono", monospace !important;
            font-size: 13px;
            line-height: 1.35;
            letter-spacing: 0.02em;
            text-transform: uppercase;
            user-select: none;
            -webkit-font-smoothing: antialiased;
          }
          .ui-layer {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 10;
            overflow: hidden;
          }
          .blend-lighter {
            mix-blend-mode: plus-lighter;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}} />
      </head>
      <body className="bg-black text-[#ddd] overflow-hidden antialiased select-none">
        <ScanProvider>
          {/* Offline Banner */}
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
