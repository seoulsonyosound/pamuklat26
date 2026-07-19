/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

export const Footer: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <footer className="w-full border-t border-slate-250 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/60 backdrop-blur-md transition-colors duration-300 mt-auto">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1">
          {/* Left: Brand Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img
                src="/SSITE (2).png"
                alt="SSITE Logo"
                className="h-10 w-auto object-contain transition-all duration-300"
                style={{ filter: isDarkMode ? 'none' : 'invert(1) brightness(0)' }}
              />
            </Link>
          </div>

          {/* Center: Centered Copyright Statement */}
          <div className="text-center font-bold text-[11px] text-slate-700 dark:text-slate-300 tracking-wider">
            © 2026 SSITE PHOTOBOOTH
          </div>

          {/* Right: Developers Credit Section */}
          <div className="flex flex-col items-center sm:items-end text-center sm:text-right leading-tight">
            <span className="text-[8px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Developed by: Candaba Girls
            </span>
            <span className="text-[11px] font-black text-slate-850 dark:text-white uppercase tracking-wider">
              ALEJOS, DELA PEÑA &amp; PASTORAL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
