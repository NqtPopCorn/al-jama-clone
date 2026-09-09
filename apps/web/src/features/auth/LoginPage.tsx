import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { AlertCircle, Eye, EyeOff, X } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOktaCard, setShowOktaCard] = useState(true);

  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Invalid username or password. Please try again.',
      );
    }
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col font-sans bg-white text-slate-800 selection:bg-blue-600 selection:text-white">
      <div className="flex-1 flex flex-col md:flex-row w-full">
        {/* Left Side: Sign in Form (Matching Image 1) */}
        <div className="w-full md:w-[420px] lg:w-[460px] xl:w-[500px] flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-white z-10 shrink-0">
          <div className="space-y-8">
            {/* Jama Connect Logo */}
            <div className="flex items-center gap-3.5 pt-2">
              <svg
                viewBox="0 0 100 100"
                className="w-12 h-12 text-[#0088cc] shrink-0"
                fill="currentColor"
              >
                {/* Stylized 3-blade Jama emblem */}
                <path d="M50 15 C45 15, 38 25, 36 38 C34 50, 42 62, 50 62 C58 62, 66 50, 64 38 C62 25, 55 15, 50 15 Z" fill="#0284c7" />
                <path d="M22 68 C22 62, 32 58, 44 65 C55 72, 58 84, 52 90 C46 96, 32 94, 25 85 C20 78, 22 71, 22 68 Z" fill="#0369a1" opacity="0.9" />
                <path d="M78 68 C78 62, 68 58, 56 65 C45 72, 42 84, 48 90 C54 96, 68 94, 75 85 C80 78, 78 71, 78 68 Z" fill="#38bdf8" />
              </svg>
              <div className="flex flex-col leading-none">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-light tracking-tight text-slate-600">jama</span>
                  <span className="text-2xl font-bold tracking-tight text-slate-900">connect</span>
                  <span className="text-[10px] text-slate-400 font-normal self-start">™</span>
                </div>
              </div>
            </div>

            {/* Sign In Header */}
            <div>
              <h2 className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
                Sign in
              </h2>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-normal text-slate-600 block">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-normal text-slate-600 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Please contact your System Administrator (admin@aljama.local) to reset credentials.');
                  }}
                  className="text-xs text-[#0284c7] hover:underline"
                >
                  Forgot your password?
                </a>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-1.5 bg-[#203a6b] hover:bg-[#1a2f55] disabled:opacity-50 text-white text-xs font-semibold rounded shadow-sm transition-colors"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            {/* Quick Demo Sign-In Buttons */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Quick Demo Sign-in:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin', 'Admin@123')}
                  className="px-2 py-1.5 border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 rounded text-xs text-slate-700 text-center transition-colors"
                >
                  <strong className="block text-slate-900">admin</strong>
                  <span className="text-[10px] text-blue-600">Full</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('member', 'Member@123')}
                  className="px-2 py-1.5 border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 rounded text-xs text-slate-700 text-center transition-colors"
                >
                  <strong className="block text-slate-900">member</strong>
                  <span className="text-[10px] text-emerald-600">Member</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('reviewer', 'Reviewer@123')}
                  className="px-2 py-1.5 border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 rounded text-xs text-slate-700 text-center transition-colors"
                >
                  <strong className="block text-slate-900">reviewer</strong>
                  <span className="text-[10px] text-amber-600">Limited (QT-08)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Copyright Section (Matching Image 1) */}
          <div className="pt-8 text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 mt-8">
            <p>© 2026 Jama Software. All rights reserved. <span className="text-[#0284c7]">www.jamasoftware.com</span></p>
            <p>Build date: 2026/09/09 17:00 — Version: Jama Connect 8.79.0 (AL-JAMA MVP)</p>
          </div>
        </div>

        {/* Right Side: Bridge Photo with Floating Okta Single Sign-On Card (Matching Image 1) */}
        <div className="hidden md:flex flex-1 relative bg-slate-900 overflow-hidden">
          {/* Bridge Photo Background with blue tint */}
          <img
            src="https://images.unsplash.com/photo-1545893835-abaa50cbe628?w=1920&auto=format&fit=crop&q=85"
            alt="Suspension Bridge"
            className="absolute inset-0 w-full h-full object-cover opacity-90 filter contrast-105"
          />
          {/* Subtle blue gradient overlay matching Jama Connect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 via-blue-800/40 to-slate-950/60 mix-blend-multiply" />

          {/* Floating Okta Card (Image 1 top right) */}
          {showOktaCard && (
            <div className="absolute top-8 right-8 w-80 bg-white rounded-lg shadow-2xl border border-slate-200 p-5 space-y-4 z-20 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#007dc1] flex items-center justify-center text-white text-[10px] font-bold">
                    O
                  </div>
                  <span className="font-bold text-sm tracking-tight text-slate-900">okta</span>
                  <span className="text-xs text-slate-500 ml-1">Sign in with 1 click</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOktaCard(false)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded border border-slate-200 bg-slate-50">
                <div className="w-9 h-9 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  <svg viewBox="0 0 100 100" className="w-5 h-5" fill="currentColor">
                    <path d="M50 15 C45 15, 38 25, 36 38 C34 50, 42 62, 50 62 C58 62, 66 50, 64 38 C62 25, 55 15, 50 15 Z" fill="#0284c7" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Jamacloud</div>
                  <div className="text-xs text-slate-500 font-mono">admin@aljama.local</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'Admin@123')}
                className="w-full py-2 bg-[#1b65d4] hover:bg-[#1554b3] text-white text-xs font-semibold rounded shadow transition-colors text-center"
              >
                Sign In to Jamacloud
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowOktaCard(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 hover:underline"
                >
                  Never sign me in
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Legal Banner (Matching Image 1 bottom) */}
      <footer className="w-full bg-[#f8fafc] border-t border-slate-200 px-6 py-2.5 text-[11px] text-slate-500 text-center flex items-center justify-between">
        <span className="truncate">
          Jama is designed for a minimum of 1024 x 768 screen resolution. Javascript MUST be enabled. For a list of supported browsers, please visit our <span className="text-[#0284c7] cursor-pointer hover:underline">support community</span>. View our <span className="text-[#0284c7] cursor-pointer hover:underline">privacy policy</span>.
        </span>
        <div className="w-3 h-3 rounded-full bg-amber-500/80 shrink-0 ml-3" title="Jama System Status: Operational" />
      </footer>
    </div>
  );
};
