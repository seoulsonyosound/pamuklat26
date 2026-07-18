'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-start justify-center py-10 sm:py-20 max-w-5xl mx-auto w-full relative px-6 sm:px-8">
      
      {/* Decorative gradient glowing spots behind hero */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-rose-500/10 via-purple-500/10 to-cyan-500/10 blur-[110px] pointer-events-none z-0" />

      {/* Hero Welcome Card */}
      <div className="w-full text-left flex flex-col items-start gap-6 z-10">
        
        {/* Huge elegant headline */}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[1.05] max-w-3xl">
          <span className="bg-gradient-to-r from-[#FF0055] via-[#8B5CF6] to-[#00D2FF] bg-clip-text text-transparent">
            SSITE PHOTOBOOTH
          </span>
        </h1>

        {/* Large, Modern Left-Aligned Glassmorphic Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto items-stretch sm:items-center justify-start">
          
          {/* Action 1: Start Capture */}
          <Link
            href="/capture"
            className="w-full sm:w-48 flex items-center justify-center py-3.5 rounded-2xl bg-white/5 border border-rose-500/35 hover:bg-rose-500/10 text-white font-extrabold text-xs tracking-wider uppercase transition-all hover:scale-[1.02] backdrop-blur-md active:scale-98 shadow-md shadow-rose-500/5 cursor-pointer"
          >
            Start Capture
          </Link>

          {/* Action 2: Gallery */}
          <Link
            href="/gallery"
            className="w-full sm:w-48 flex items-center justify-center py-3.5 rounded-2xl bg-white/5 border border-cyan-500/35 hover:bg-cyan-500/10 text-white font-extrabold text-xs tracking-wider uppercase transition-all hover:scale-[1.02] backdrop-blur-md active:scale-98 shadow-md shadow-cyan-500/5 cursor-pointer"
          >
            Photo Gallery
          </Link>

        </div>
      </div>

    </div>
  );
}
