'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, Images, ArrowRight, RotateCcw } from 'lucide-react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex-grow flex flex-col justify-center items-center py-8 md:py-16 w-full max-w-full mx-auto px-2 sm:px-4 lg:px-6 relative z-10">

      {/* Editorial layout container: Pushed further left and right with wide flex gap */}
      <div className="w-full flex flex-col lg:flex-row justify-between items-center gap-12 lg:gap-24">

        {/* LEFT COLUMN: Bold SSITE PHOTOBOOTH text directly on background (Positioned strictly left) */}
        <div
          className={`w-full lg:max-w-[480px] xl:max-w-[540px] flex flex-col items-start text-left relative transition-all duration-[1000ms] cubic-bezier(0.16, 1, 0.3, 1) ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
        >
          {/* Giant "20" outline number behind left text */}
          <span
            className="absolute -top-24 -left-12 text-[38vw] lg:text-[22vw] font-black tracking-tighter leading-none select-none pointer-events-none"
            style={{
              fontFamily: '"Outfit", sans-serif',
              WebkitTextStroke: '2.5px rgba(255, 255, 255, 0.08)',
              color: 'transparent',
            }}
          >
            20
          </span>

          {/* SSITE PHOTOBOOTH heading - Slightly reduced default sizing for better horizontal fit */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] xl:text-[6.2rem] font-black tracking-tighter leading-[0.85] text-white z-10 font-sans w-full group/title cursor-default select-none">
            <span className="block transition-transform duration-500 ease-out group-hover/title:translate-x-3 group-hover/title:text-[#ff0055]">
              SSITE
            </span>
            <span className="block text-white/20 mt-2 uppercase tracking-tight transition-all duration-500 ease-out group-hover/title:-translate-x-3 group-hover/title:text-white/50">
              PHOTOBOOTH
            </span>
          </h1>

          {/* Subtitle text */}
          <p className="text-white/45 font-medium text-base sm:text-lg mt-6 max-w-md tracking-wide leading-relaxed z-10">
            An offline-first photostrip generation suite. Customize layouts, capture snapshots, and save locally with instant browser access.
          </p>

          <div className="flex gap-6 mt-8 z-10 text-[11px] font-bold tracking-widest text-white/25 uppercase">
            <span>IndexedDB Storage</span>
            <span>•</span>
            <span>PWA Offline</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Bigger Gradient Card positioned strictly to the right */}
        <div
          className={`w-full lg:max-w-[480px] xl:max-w-[520px] rounded-[38px] text-white p-8 md:p-12 relative overflow-hidden flex flex-col justify-between min-h-[480px] md:min-h-[530px] transition-all duration-[1000ms] delay-100 cubic-bezier(0.16, 1, 0.3, 1) group cursor-pointer ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
            }`}
          style={{
            background: 'linear-gradient(135deg, #ff0055 0%, #6d28d9 100%)',
            boxShadow: '0 30px 60px -15px rgba(255, 0, 85, 0.35)',
          }}
        >
          {/* Giant "26" watermark background inside the card */}
          <span
            className="absolute -bottom-24 -right-20 text-[38vw] lg:text-[22vw] font-black tracking-tighter leading-none text-[#060814]/35 select-none pointer-events-none transition-transform duration-700 ease-out group-hover:scale-105 group-hover:-translate-x-3 group-hover:-translate-y-2"
            style={{
              fontFamily: '"Outfit", sans-serif',
            }}
          >
            26
          </span>

          {/* Top header tags inside card */}
          <div className="flex justify-between items-center z-10 w-full">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
              @ssite.ua@gmail.com
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
              ssite.26
            </span>
          </div>

          {/* Center heading inside card */}
          <div className="z-10 mt-auto pt-24">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/50 block mb-1">
              Capture Module
            </span>
            <h2 className="text-3xl font-black tracking-tight leading-none uppercase font-sans">
              Instant Generation
            </h2>
            <p className="text-white/85 text-sm mt-3.5 max-w-sm font-medium leading-relaxed">
              Capture 4 vertical grid layouts instantly using local camera devices.
            </p>
          </div>

          {/* Bottom Action buttons */}
          <div className="z-10 mt-8 flex flex-col sm:flex-row gap-4 w-full">
            {/* Transparent Button with White Slide-in from Left */}
            {/* Transparent Button with White Slide-in from Left */}
            <Link
              href="/capture"
              className="group/btn relative overflow-hidden flex items-center justify-between flex-1 p-5 rounded-none bg-transparent text-white font-black text-xs tracking-[0.15em] border-0 hover:text-[#060814] transition-all duration-300 ease-out hover:-translate-y-1 active:translate-y-0 z-10"
            >
              {/* White slide panel overlay */}
              <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[400ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />

              <div className="flex items-center gap-3">
                <Camera className="h-5 w-5 text-[#ff0055] transition-all duration-300 group-hover/btn:rotate-12 group-hover/btn:text-[#060814]" />
                <span>START CAPTURE</span>
              </div>
              <ArrowRight className="h-4.5 w-4.5 transition-all duration-300 group-hover/btn:translate-x-1" />
            </Link>

            {/* Transparent Button with White Slide-in from Left */}
            <Link
              href="/gallery"
              className="group/btn relative overflow-hidden flex items-center justify-between flex-1 p-5 rounded-none bg-transparent text-white font-black text-xs tracking-[0.15em] border-0 hover:text-[#060814] transition-all duration-300 ease-out hover:-translate-y-1 active:translate-y-0 z-10"
            >
              {/* White slide panel overlay */}
              <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[400ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />

              <div className="flex items-center gap-3">
                <Images className="h-5 w-5 text-[#06b6d4] transition-all duration-300 group-hover/btn:scale-11 group-hover/btn:text-[#060814]" />
                <span>VIEW GALLERY</span>
              </div>
              <ArrowRight className="h-4.5 w-4.5 transition-all duration-300 group-hover/btn:translate-x-1" />
            </Link>
          </div>

          {/* Bottom card footer */}
          <div className="flex justify-between items-center z-10 mt-8 border-t border-white/10 pt-4 w-full">
            <span className="text-[9px] font-black uppercase tracking-wider text-white/50">
              ssite edition
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider text-white/50">
              2026 version
            </span>
          </div>
        </div>

      </div>

      {/* Grid lines layout backdrop */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] grid-lines" />
    </div>
  );
}
