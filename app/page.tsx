'use client';

import React from 'react';
import { LandingCards } from '@/components/LandingCards';
import { RightLandingColumn } from '@/components/RightLandingColumn';
import { RepoInput } from '@/components/RepoInput';

export default function LandingPage() {
  return (
    <>
      {/* Left List: Headline demo findings with 160px thumbs */}
      <LandingCards />

      {/* Center / Lower Third: Repo URL Input */}
      <RepoInput />

      {/* Right Column: [info], [aims], [exploring], [connect] */}
      <RightLandingColumn />
    </>
  );
}
