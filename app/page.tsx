'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, Images, ArrowRight } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { AdminService } from '@/services/AdminService';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    setIsAdmin(AdminService.isAuthenticated());
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="flex-grow flex flex-col justify-center items-center relative z-10"
      style={{
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        marginTop: '-1.5rem',
        marginBottom: '-1.5rem',
        width: '100vw',
      }}
    >
      {/* Full-width split layout */}
      <div className="w-full flex flex-col lg:flex-row" style={{ minHeight: 'calc(100vh - 5rem)' }}>

        {/* LEFT SIDE: Text content on page background */}
        <div
          className={`w-full lg:w-[48%] flex flex-col justify-center items-start text-left relative px-8 sm:px-12 lg:px-16 xl:px-24 py-16 lg:py-12 transition-all duration-[1000ms] cubic-bezier(0.16, 1, 0.3, 1) ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
        >
          {/* Giant "20" outline number */}
          <span
            className="absolute top-[10%] -left-4 text-[28vw] lg:text-[16vw] font-black tracking-tighter leading-none select-none pointer-events-none transition-colors duration-300"
            style={{
              fontFamily: '"Outfit", sans-serif',
              WebkitTextStroke: theme === 'light' ? '2px rgba(15, 23, 42, 0.05)' : '2px rgba(255, 255, 255, 0.06)',
              color: 'transparent',
            }}
          >
            20
          </span>

          {/* SSITE PHOTOBOOTH heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[4.5rem] xl:text-[5.5rem] font-black tracking-tighter leading-[0.85] text-slate-900 dark:text-white z-10 font-sans w-full group/title cursor-default select-none">
            <span className="block transition-transform duration-500 ease-out group-hover/title:translate-x-3 group-hover/title:text-[#ff0055]">
              SSITE
            </span>
            <span className="block text-slate-400 dark:text-white/20 mt-1 uppercase tracking-tight transition-all duration-500 ease-out group-hover/title:-translate-x-3 group-hover/title:text-slate-900 dark:group-hover/title:text-white/50">
              PHOTOBOOTH
            </span>
          </h1>



          {/* Grid lines layout backdrop */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] grid-lines" />
        </div>

        {/* RIGHT SIDE: Full-height gradient panel flush to edge */}
        <div
          className={`w-full lg:w-[52%] text-white relative overflow-hidden flex flex-col min-h-[420px] lg:min-h-0 transition-all duration-[1000ms] delay-100 cubic-bezier(0.16, 1, 0.3, 1) group ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          style={{
            background: 'linear-gradient(135deg, #ff0055 0%, #6d28d9 100%)',
          }}
        >
          {/* Inner content */}
          <div className="relative z-10 flex flex-col justify-between flex-1 p-8 md:p-10 lg:p-12 xl:p-14">
            {/* Top header tags */}
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-4 z-20">
                <a
                  href="https://www.facebook.com/UASSITE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors duration-200"
                  aria-label="Facebook"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/@UACITOfficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors duration-200"
                  aria-label="YouTube"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                  </svg>
                </a>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                SSITE 2627
              </span>
            </div>

            {/* Center heading — vertically centered */}
            <div className="flex-1 flex flex-col justify-center py-8">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-none uppercase font-sans">
                PAMUKLAT
              </h2>
              <p className="text-white/80 text-sm mt-3 max-w-sm font-medium leading-relaxed">
                Capture 4 vertical grid layouts instantly using local camera devices.
              </p>
            </div>

            {/* Bottom Action buttons */}
            <div>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                {isAdmin && (
                  <Link
                    href="/capture"
                    className="group/btn relative overflow-hidden flex items-center justify-between flex-1 p-4 sm:p-5 rounded-none bg-transparent text-white font-black text-xs tracking-[0.15em] border-0 hover:text-[#060814] transition-all duration-300 ease-out hover:-translate-y-1 active:translate-y-0 z-10"
                  >
                    <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[400ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
                    <div className="flex items-center gap-3">
                      <Camera className="h-5 w-5 text-[#ff0055] transition-all duration-300 group-hover/btn:rotate-12 group-hover/btn:text-[#060814]" />
                      <span>START CAPTURE</span>
                    </div>
                    <ArrowRight className="h-4.5 w-4.5 transition-all duration-300 group-hover/btn:translate-x-1" />
                  </Link>
                )}

                <Link
                  href="/gallery"
                  className="group/btn relative overflow-hidden flex items-center justify-between flex-1 p-4 sm:p-5 rounded-none bg-transparent text-white font-black text-xs tracking-[0.15em] border-0 hover:text-[#060814] transition-all duration-300 ease-out hover:-translate-y-1 active:translate-y-0 z-10"
                >
                  <div className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-[400ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
                  <div className="flex items-center gap-3">
                    <Images className="h-5 w-5 text-[#06b6d4] transition-all duration-300 group-hover/btn:scale-11 group-hover/btn:text-[#060814]" />
                    <span>VIEW GALLERY</span>
                  </div>
                  <ArrowRight className="h-4.5 w-4.5 transition-all duration-300 group-hover/btn:translate-x-1" />
                </Link>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center mt-6 border-t border-white/10 pt-4 w-full">
                <span className="text-[9px] font-black uppercase tracking-wider text-white/50">
                  ssite edition
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider text-white/50">
                  2026 version
                </span>
              </div>
            </div>
          </div>

          {/* Giant "26" watermark */}
          <span
            className="absolute -bottom-16 -right-12 text-[30vw] lg:text-[18vw] font-black tracking-tighter leading-none text-[#060814]/30 select-none pointer-events-none transition-transform duration-700 ease-out group-hover:scale-105 group-hover:-translate-x-3 group-hover:-translate-y-2"
            style={{
              fontFamily: '"Outfit", sans-serif',
            }}
          >
            26
          </span>
        </div>

      </div>
    </div>
  );
}
