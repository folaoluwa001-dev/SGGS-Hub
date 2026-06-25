'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { schoolConfig } from '../../../config/school.config';
import { useTheme } from '@/components/Providers';
import { ShieldCheck, User, Lock, Key, Moon, Sun, ArrowRight, RefreshCw } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError(null);

    try {
      const payload: any = { username, password };
      if (twoFactorRequired) {
        payload.twoFactorCode = twoFactorCode;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.twoFactorRequired) {
        setTwoFactorRequired(true);
        setLoading(false);
        return;
      }

      // Login successful! Save role details and redirect
      if (data.success && data.user) {
        const role = data.user.role;
        // Store user state
        localStorage.setItem('sggs-user', JSON.stringify(data.user));
        
        if (role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else if (role === 'TEACHER') {
          router.push('/teacher');
        } else if (role === 'BURSAR') {
          router.push('/bursar');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-custom text-fg-custom justify-between">
      {/* Top Bar Actions */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div 
            className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: schoolConfig.schoolLogo }}
          />
          <span className="font-bold text-xs tracking-wider">SGGS Portal</span>
        </Link>
        
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-card-custom border border-border-custom hover:bg-muted-custom transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-secondary" />}
        </button>
      </header>

      {/* Main Login Card */}
      <main className="flex items-center justify-center px-4 flex-grow py-12">
        <div className="w-full max-w-md p-8 rounded-3xl bg-card-custom border border-border-custom shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-primary dark:text-white">Staff Portal Login</h1>
            <p className="text-xs text-muted-fg-custom">
              {twoFactorRequired 
                ? "Account secured with 2FA. Verify code to enter."
                : "Enter credentials to access your dashboard block."}
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {!twoFactorRequired ? (
              /* STAGE 1: CREDENTIALS */
              <>
                <div className="space-y-1.5">
                  <label htmlFor="username" className="text-xs font-bold text-slate-400">Username</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-ring-custom"
                      placeholder="e.g. admin"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-bold text-slate-400">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-ring-custom"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* STAGE 2: 2FA CODE */
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="twoFactorCode" className="text-xs font-bold text-slate-400">6-Digit 2FA Code</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="twoFactorCode"
                      type="text"
                      required
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg-custom border border-border-custom text-center text-lg font-black tracking-[0.5em] focus:outline-hidden focus:ring-2 focus:ring-ring-custom"
                      placeholder="000000"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTwoFactorRequired(false)}
                  className="block text-[10px] text-accent-light font-bold hover:underline mx-auto"
                >
                  Back to credentials
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-light text-white font-extrabold text-sm shadow-md flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>{twoFactorRequired ? "Confirm 2FA Code" : "Log In"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="text-center py-6 text-[10px] text-slate-500">
        Authorized staff access only. Activity is monitored under security audit trails.
      </footer>
    </div>
  );
}
