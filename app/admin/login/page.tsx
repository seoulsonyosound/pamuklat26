'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminService } from '@/services/AdminService';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (AdminService.isAuthenticated()) {
      router.replace('/admin/frame');
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const success = AdminService.login(username, password);
    if (success) {
      router.push('/admin/frame');
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12">
      {/* Login Card */}
      <div className="w-full max-w-md glass-card rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-8">
          <h1 className="text-2xl font-black text-white">Admin Console</h1>
          <p className="text-slate-400 text-xs">
            Enter credentials to configure custom template overlays.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs font-semibold mb-6 animate-pulse text-center">
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Username input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:bg-slate-950 transition-all"
            />
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 focus:bg-slate-950 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 mt-2 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold transition-all shadow-lg shadow-rose-500/10 cursor-pointer border-0"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}
