import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  Server,
  Globe,
  Database,
  ShieldCheck,
  ArrowRight,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { APP_NAME } from '@aljama/shared';

interface ApiHealthData {
  app?: string;
  message?: string;
  timestamp?: string;
}

export function App() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [apiData, setApiData] = useState<ApiHealthData | null>(null);

  const checkApiHealth = async () => {
    setApiStatus('loading');
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setApiData(data);
        setApiStatus('connected');
      } else {
        setApiStatus('error');
      }
    } catch {
      setApiStatus('error');
    }
  };

  useEffect(() => {
    checkApiHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-blue-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 max-w-4xl w-full space-y-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 shadow-inner">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AL-JAMA Monorepo Scaffolding Complete</span>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            {APP_NAME} Requirements Center
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Next-generation Requirements Traceability, Review Management &amp; Enterprise
            Collaboration.
          </p>
        </div>

        {/* Status Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {/* Web App Status */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md space-y-3 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Globe className="h-5 w-5" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Ready
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Frontend (Vite + React)</h3>
              <p className="text-xs text-slate-400 mt-1">Port: 5173 • shadcn/ui &amp; Tailwind</p>
            </div>
          </div>

          {/* API App Status */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md space-y-3 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Server className="h-5 w-5" />
              </div>
              <span
                className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                  apiStatus === 'connected'
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50'
                    : apiStatus === 'loading'
                      ? 'text-amber-400 bg-amber-950/60 border-amber-800/50'
                      : 'text-rose-400 bg-rose-950/60 border-rose-800/50'
                }`}
              >
                {apiStatus === 'connected' ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Online
                  </>
                ) : apiStatus === 'loading' ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" /> Checking
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3" /> Not Connected
                  </>
                )}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Backend API (NestJS)</h3>
              <p className="text-xs text-slate-400 mt-1">Port: 3000 • Modular Monolith</p>
            </div>
          </div>

          {/* Shared Package Status */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md space-y-3 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400">
                <Layers className="h-5 w-5" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Linked
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">Shared Types &amp; Utils</h3>
              <p className="text-xs text-slate-400 mt-1">@aljama/shared package</p>
            </div>
          </div>
        </div>

        {/* Live Backend Response Box */}
        {apiData && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-left font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between text-slate-400 mb-2 font-sans text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Database className="h-3.5 w-3.5 text-blue-400" /> Response from GET /api/health
              </span>
              <span>{apiData.timestamp}</span>
            </div>
            <pre className="bg-slate-950/80 p-3 rounded border border-slate-800/60 overflow-x-auto text-emerald-400">
              {JSON.stringify(apiData, null, 2)}
            </pre>
          </div>
        )}

        {/* Action Button & Documentation Links */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={checkApiHealth}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Ping API Health
          </button>
          <a
            href="http://localhost:3000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm transition cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Swagger API Docs
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </main>
    </div>
  );
}

export default App;
