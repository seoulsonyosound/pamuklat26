'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Camera, Image as ImageIcon, LayoutTemplate, Home, LogOut } from 'lucide-react';
import { SyncIndicator } from './SyncIndicator';
import { AdminService } from '@/services/AdminService';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

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
    { label: 'Capture', path: '/capture', icon: Camera },
    { label: 'Gallery', path: '/gallery', icon: ImageIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-white">
              <Camera className="h-6 w-6 text-rose-500" />
              <span className="font-sans font-extrabold tracking-wider text-sm sm:text-base bg-gradient-to-r from-rose-500 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
                SSITE PHOTOBOOTH
              </span>
            </Link>
          </div>

          {/* Navigation Links (Center) */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right side: Sync indicator & Auth Controls */}
          <div className="flex items-center gap-3">
            <SyncIndicator />
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/frame"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer"
                >
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  Upload Frame
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-350 border border-slate-800 transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/admin/login"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-500 to-indigo-650 hover:from-rose-600 hover:to-indigo-750 text-white transition-all shadow-md shadow-rose-500/10 cursor-pointer border-0"
              >
                <LogOut className="h-3.5 w-3.5 rotate-180" />
                Login
              </Link>
            )}
          </div>
        </div>
        
        {/* Mobile menu (tabs at the bottom of screen or simple row on smaller devices) */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-800 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-semibold transition-all duration-200 ${
                  isActive ? 'text-rose-400' : 'text-slate-500 hover:text-slate-300'
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
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-[10px] font-semibold transition-all duration-200 ${
                pathname === '/admin/frame' ? 'text-rose-400' : 'text-slate-500'
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
