'use client';

import React from 'react';
import { useScan, ALL_TAGS } from '@/context/ScanContext';

export function TagsRow() {
  const { selectedTags, toggleTag, status } = useScan();

  return (
    <div
      className="pointer-events-auto fixed top-[120px] left-6 w-[320px] hidden md:flex flex-wrap gap-1.5 z-20 select-none"
      role="toolbar"
      aria-label="Detector and Language Filters"
    >
      {ALL_TAGS.map((tag) => {
        const isActive = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`px-2 py-1 text-[11px] tracking-[.02em] uppercase font-mono border transition-all cursor-pointer ${
              isActive
                ? 'border-[#aa88ff] text-[#aa88ff] bg-[#1c1c1c]'
                : 'border-[#2a2a2a] text-[#8a8a8a] bg-[#1c1c1c] hover:border-[#444] hover:text-[#ddd]'
            } focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#aa88ff] focus-visible:outline-offset-2`}
            aria-pressed={isActive}
            title={
              status === 'idle'
                ? `Toggle detector group: ${tag}`
                : `Filter findings by: ${tag}`
            }
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
