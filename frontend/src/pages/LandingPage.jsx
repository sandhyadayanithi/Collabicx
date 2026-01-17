import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="bg-black font-display text-white min-h-screen flex flex-col relative overflow-hidden">
            {/* Top Navigation */}
            <nav className="relative z-20 flex items-center justify-between px-8 md:px-16 lg:px-24 py-8">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Collabix" className="w-16 h-16 object-contain" />
                    <span className="text-2xl font-bold tracking-tight text-emerald-500">Collabicx</span>
                </div>

                <button
                    onClick={() => navigate('/login')}
                    className="h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-emerald-950 rounded-xl font-black transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                >
                    Login / Sign Up
                    <svg height="18" width="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </nav>

            {/* Main Hero Content */}
            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 text-center">
                {/* Visual Accent/Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/10 blur-[160px] rounded-full pointer-events-none"></div>

                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-4xl">
                    <h1 className="text-[64px] md:text-[84px] lg:text-[100px] font-black leading-[0.95] tracking-[-0.05em] text-white mb-8">
                        Build the <br />
                        <span className="text-emerald-500">Future</span> Together
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-700 dark:text-emerald-100/60
 font-medium leading-relaxed mb-16 max-w-2xl mx-auto">
                        The ultimate collaborative platform for modern hackathons. Organize projects, track progress, and communicate with your team in real-time.
                    </p>

                    {/* Terminal Graphic (Centered for Landing) */}
                    <div className="w-full max-w-2xl aspect-[1.8/1] rounded-[32px] bg-white/10 dark:bg-black/40 backdrop-blur-2xl border border-emerald-500/20 shadow-2xl overflow-hidden flex flex-col p-8 md:p-12 group transition-transform hover:scale-[1.02] duration-500 mx-auto">
                        <div className="flex gap-2.5 mb-8">
                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-900/40"></div>
                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-900/40"></div>
                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-900/40"></div>
                        </div>
                        <div className="flex flex-col gap-6 text-left">
                            <div className="flex items-center gap-4 text-emerald-500/40">
                                <span className="material-symbols-outlined text-[64px]">terminal</span>
                                <div className="flex flex-col gap-2">
                                    <div className="h-3 w-48 bg-emerald-900/30 rounded-full"></div>
                                    <div className="h-3 w-32 bg-emerald-900/20 rounded-full"></div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4 ml-6">
                                <div className="h-2.5 w-64 bg-emerald-900/40 rounded-full"></div>
                                <div className="h-2.5 w-80 bg-emerald-900/40 rounded-full"></div>
                                <div className="h-2.5 w-48 bg-emerald-900/40 rounded-full"></div>
                            </div>
                        </div>
                        <div className="mt-auto flex items-center gap-4 ml-6">
                            <div className="h-4 w-4 bg-emerald-500 rounded-sm animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                            <div className="h-2.5 w-32 bg-emerald-900/20 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Background Decorative Elements */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none"></div>
        </div>
    );
}
