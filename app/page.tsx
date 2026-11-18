'use client';

import React, { useState } from 'react';
import { AxonScene } from '@/components/AxonScene';

const TAGS = [
  'All',
  'Light',
  'Physics',
  'Fluids',
  'Grid',
  'Audio',
  'Volumes',
  'Particles',
  'Capture',
  'Render',
];

const CARDS = [
  {
    id: 1,
    video: 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/oraciteslArea.mp4',
    left: 'Lattices / zone',
    right: 'Ambient light / study',
  },
  {
    id: 2,
    video: 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/facet-glass-hero.mp4',
    left: 'Prism / shell',
    right: 'Dispersion hero / render',
  },
  {
    id: 3,
    video: 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/stellarmind-hero.mp4',
    left: 'Nebular / loop',
    right: 'Procedural hero / sequence',
  },
  {
    id: 4,
    video: 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/thedropthroughArea.mp4',
    left: 'Fall / forward',
    right: 'Dolly track / study',
  },
];

export default function AxonPage() {
  const [activeTag, setActiveTag] = useState('All');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-[#dddddd] font-mono select-none text-[13px] leading-[1.35] tracking-[0.02em] uppercase">
      {/* Layer 1: canvas#bg fixed full viewport */}
      <AxonScene />

      {/* Layer 2: .ui fixed inset-0 */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Brand */}
        <div className="pointer-events-auto absolute top-6 left-6 flex items-center gap-[14px]">
          {/* 40x40 SVG mark: 18.5px radius circle stroke white 1.6, plus 8-point star */}
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
          >
            <circle cx="20" cy="20" r="18.5" stroke="#ffffff" strokeWidth="1.6" />
            <polygon
              points="20,9 23,17 31,20 23,23 20,31 17,23 9,20 17,17"
              fill="#ffffff"
            />
          </svg>

          <div className="flex flex-col">
            <span className="text-[20px] font-bold text-white tracking-[0.02em] leading-none">
              AXON
            </span>
            <span className="text-[11px] text-[#8a8a8a] tracking-[0.02em] mt-[2px] leading-none">
              MOTION RESEARCH
            </span>
          </div>
        </div>

        {/* Counter */}
        <div className="pointer-events-auto absolute top-6 right-6 w-11 h-11 rounded-full border border-[#2a2a2a] bg-[#0a0a0a] flex items-center justify-center text-[14px] text-white">
          07
        </div>

        {/* Tags */}
        <div className="pointer-events-auto absolute top-[120px] left-6 w-[320px] hidden md:flex flex-wrap gap-[6px]">
          {TAGS.map((tag) => {
            const isActive = tag === activeTag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(tag)}
                className={`py-[5px] px-[9px] text-[11px] uppercase tracking-[0.02em] transition-colors cursor-pointer border-none outline-none ${
                  isActive
                    ? 'bg-[#e6e6e6] text-[#000000] font-semibold'
                    : 'bg-[#1c1c1c] text-[#cfcfcf] hover:text-white'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* Card list - spacious and fully visible */}
        <div className="pointer-events-auto absolute top-[230px] left-6 bottom-0 w-[350px] lg:w-[380px] hidden md:flex flex-col overflow-y-auto no-scrollbar pb-24 pr-2">
          {CARDS.map((card) => (
            <div
              key={card.id}
              className="py-[24px] border-t border-[#2a2a2a] first:border-t-0 group cursor-pointer"
            >
              {/* .thumb: spacious 200px height, radius 3, background #0a0a0a, video cover-fitted */}
              <div className="h-[200px] rounded-[3px] bg-[#0a0a0a] border border-[#1f1f1f] group-hover:border-[#aa88ff]/50 transition-colors duration-300 overflow-hidden relative shadow-lg">
                <video
                  src={card.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>

              {/* .meta: flex space-between gap 16, margin-top 14, 12 px */}
              <div className="flex justify-between items-start gap-4 mt-[14px] text-[12px] leading-[1.4] tracking-[0.02em]">
                <div className="text-white whitespace-pre-line text-left font-medium group-hover:text-[#aa88ff] transition-colors duration-200">
                  {card.left}
                </div>
                <div className="text-[#8a8a8a] whitespace-pre-line text-right">
                  {card.right}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Text column .about: mix-blend-mode plus-lighter */}
        <div
          className="pointer-events-auto absolute z-10 flex flex-col justify-center text-[13px] leading-[1.35] tracking-[0.02em] font-mono
            left-6 right-6 bottom-6 md:bottom-auto md:left-auto md:top-1/2 md:-translate-y-1/2
            md:w-[320px] lg:w-[380px] md:right-6 lg:right-[90px]"
          style={{ mixBlendMode: 'plus-lighter' }}
        >
          <div className="flex flex-col gap-[2.2em] text-[#dddddd]">
            {/* [info] */}
            <div>
              <h2 className="text-[#aa88ff] text-[13px] font-bold mb-[1em] tracking-[0.02em]">
                [INFO]
              </h2>
              <p className="text-[#dddddd] text-left md:text-justify mb-[1em]">
                STUDIES ARE PUBLISHED AS THEY ARE BUILT AND MAY NOT RUN ON EVERY DEVICE.
              </p>
            </div>

            {/* [aims] */}
            <div>
              <h2 className="text-[#aa88ff] text-[13px] font-bold mb-[1em] tracking-[0.02em]">
                [AIMS]
              </h2>
              <p className="text-[#dddddd] text-left md:text-justify mb-[1em]">
                AN OPEN LOGBOOK OF REAL-TIME RENDERING RESEARCH: SURFACES, FLUIDS, FIELDS, AND THE LITTLE TOOLS WE BUILD TO SHAPE THEM.
              </p>
              <p className="text-[#dddddd] text-left md:text-justify mb-[1em]">
                IT IS HERE TO KEEP THE WORK IN VIEW AND TO GIVE EACH NEW PROJECT A PLACE TO GROW.
              </p>
            </div>

            {/* [exploring] */}
            <div>
              <h2 className="text-[#aa88ff] text-[13px] font-bold mb-[1em] tracking-[0.02em]">
                [EXPLORING]
              </h2>
              <div className="text-[#dddddd] mb-[1em]">
                • SIGNED SURFACES &nbsp;• CURSOR TURBULENCE &nbsp;• COMPUTE PASSES &nbsp;• TYPE IN 3D SPACE
              </div>
            </div>

            {/* [connect] */}
            <div>
              <h2 className="text-[#aa88ff] text-[13px] font-bold mb-[1em] tracking-[0.02em]">
                [CONNECT]
              </h2>
              <div className="flex flex-col gap-1">
                <a
                  href="#"
                  className="block underline hover:opacity-70 transition-opacity duration-300 text-[#dddddd]"
                >
                  INDEX -&gt; AXON
                </a>
                <a
                  href="mailto:hello@axonlab.dev"
                  className="block underline hover:opacity-70 transition-opacity duration-300 text-[#dddddd]"
                >
                  MAIL -&gt; HELLO@AXONLAB.DEV
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
