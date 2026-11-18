import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AXON..',
  description:
    'AXON is a motion research studio: an open logbook of real-time rendering studies in particles, fluids and signed surfaces.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-[#ddd] overflow-hidden antialiased">
        {children}
      </body>
    </html>
  );
}
