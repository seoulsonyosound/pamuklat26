/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Camera, Image as ImageIcon, LayoutTemplate, Home, LogOut, Sun, Moon } from 'lucide-react';
import { SyncIndicator } from './SyncIndicator';
import { AdminService } from '@/services/AdminService';
import { useTheme } from '@/context/ThemeContext';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const { isDarkMode, toggleTheme } = useTheme();

  // Sync auth state reactively when layout pathname routes change
  useEffect(() => {
    setIsAdmin(AdminService.isAuthenticated());
  }, [pathname]);

  const handleLogout = () => {
    AdminService.logout();
    setIsAdmin(false);
    router.push('/');
  };

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    ...(isAdmin ? [{ label: 'Capture', path: '/capture', icon: Camera }] : []),
    { label: 'Gallery', path: '/gallery', icon: ImageIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/SSITE (2).png"
                alt="SSITE Logo"
                className="h-16 sm:h-20 w-auto object-contain transition-all duration-300"
                style={{ filter: isDarkMode ? 'none' : 'invert(1) brightness(0)' }}
              />
            </Link>
          </div>

          {/* Navigation Links (Center) */}
          <div className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`group relative overflow-hidden flex items-center px-6 py-2.5 rounded-none text-sm font-black border-0 transition-all duration-300 ease-out z-10 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-[#060814] opacity-100 shadow-md'
                      : 'text-slate-800 dark:text-white/60 hover:text-[#ff0055] dark:hover:text-[#ff0055]'
                  }`}
                >
                  {/* Solid white slide background overlay on hover */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-rose-50 dark:bg-white/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
                  )}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side: Theme Toggle, Sync indicator & Auth Controls */}
          <div className="flex items-center gap-3">
            <SyncIndicator />

            {/* Theme Toggle Icon Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme mode"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="group relative overflow-hidden flex items-center justify-center p-2.5 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 transition-all duration-300 ease-out z-10 cursor-pointer"
            >
              <div className="absolute inset-0 bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
              {isDarkMode ? (
                <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 group-hover:rotate-45" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600 transition-transform duration-300 group-hover:-rotate-12" />
              )}
            </button>

            {isAdmin ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/frame"
                  className="group relative overflow-hidden hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border-0 text-indigo-400 hover:text-[#060814] transition-colors duration-300 ease-out z-10 bg-indigo-500/10"
                >
                  <div className="absolute inset-0 bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  <span>Upload Frame</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="group relative overflow-hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border-0 text-slate-300 hover:text-[#060814] transition-colors duration-300 ease-out z-10 bg-slate-900 dark:bg-slate-900"
                >
                  <div className="absolute inset-0 bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/admin/login"
                className="group relative overflow-hidden flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-0 text-white hover:text-[#060814] transition-colors duration-300 ease-out z-10 bg-rose-500"
              >
                <div className="absolute inset-0 bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-[350ms] cubic-bezier(0.16, 1, 0.3, 1) -z-10" />
                <LogOut className="h-3.5 w-3.5 rotate-180 text-white group-hover:text-rose-500 transition-colors duration-300" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu (tabs at the bottom of screen or simple row on smaller devices) */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-200 dark:border-slate-800 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-semibold transition-all duration-200 ${isActive ? 'text-rose-400' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Mobile Admin Link if logged in */}
          {isAdmin && (
            <Link
              href="/admin/frame"
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-semibold transition-all duration-200 ${pathname === '/admin/frame' ? 'text-rose-400' : 'text-slate-500'
                }`}
            >
              <LayoutTemplate className="h-5 w-5" />
              <span>Admin Frame</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
