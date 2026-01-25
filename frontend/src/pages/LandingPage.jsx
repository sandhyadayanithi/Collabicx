import React from 'react';
import { useNavigate } from 'react-router-dom';
import Aurora from '../components/Aurora';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen flex flex-col relative overflow-hidden">
            {/* Aurora Background */}
            <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
                <Aurora
                    colorStops={["#7cff67", "#a3f0e1", "#5227FF"]}
                    blend={0.5}
                    amplitude={1.0}
                    speed={1}
                />
            </div>

            {/* Top Navigation */}
            <nav className="relative z-20 flex items-center justify-between px-8 md:px-16 lg:px-24 py-8">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Collabix" className="w-16 h-16 object-contain" />
                    <span className="text-2xl font-bold tracking-tight text-emerald-500">Collabicx</span>
                </div>
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
                    <p className="text-xl md:text-2xl text-slate-700 dark:text-emerald-100 font-medium leading-relaxed mb-12 max-w-2xl mx-auto">
                        The ultimate collaborative platform for modern hackathons. Organize projects, track progress, and communicate with your team in real-time.
                    </p>

                    <button
                        onClick={() => navigate('/login')}
                        className="h-16 px-12 bg-emerald-600 hover:bg-emerald-500 text-emerald-950 rounded-2xl font-black text-xl transition-all shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto mb-16"
                    >
                        Get Started
                        <svg height="24" width="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </main>

            {/* Background Decorative Elements */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none"></div>
        </div>
    );
}
