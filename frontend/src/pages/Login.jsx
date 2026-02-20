import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleSignIn, githubSignIn, loginWithEmail, signUpWithEmail } from '../firebase/functions';
import { auth } from '../firebase/config';

export default function Login() {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isSignUp) {
                await signUpWithEmail(email, password, name);
                navigate('/profile-setup');
            } else {
                await loginWithEmail(email, password);
                // Frontend-only mode: assume returning user goes to teams
                navigate('/teams');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            await googleSignIn();
            // Frontend-only mode: always go to teams or profile setup
            navigate('/teams');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGithubSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            await githubSignIn();
            navigate('/teams');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen flex items-center justify-center p-6 selection:bg-emerald-500/30 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-[440px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="flex flex-col items-center mb-10">
                    <div className="cursor-pointer hover:scale-105 transition-transform mb-4" onClick={() => navigate('/')}>
                        <img src="/logo.png" alt="Collabix" className="w-20 h-20 object-contain" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">{isSignUp ? 'Join Collabicx' : 'Welcome Back'}</h2>
                    <p className="text-slate-500 dark:text-slate-300 font-medium text-center">
                        {isSignUp ? 'Create your account to start building together' : 'Please enter your details to sign in'}
                    </p>
                </div>

                <div className="vibrant-card border border-emerald-500/20 rounded-3xl p-8 md:p-10 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl flex items-center gap-2">
                            <svg height="18" width="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="12" cy="16" r="1" fill="currentColor" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-4 mb-8">
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full h-14 flex items-center justify-center gap-3 bg-[#1a2335] border border-slate-800 rounded-xl text-white font-bold transition-all hover:bg-slate-800 active:scale-[0.98] group disabled:opacity-50"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                            </svg>
                            Continue with Google
                        </button>

                        <button
                            onClick={handleGithubSignIn}
                            disabled={loading}
                            className="w-full h-14 flex items-center justify-center gap-3 bg-[#1a2335] border border-slate-800 rounded-xl text-white font-bold transition-all hover:bg-slate-800 active:scale-[0.98] group disabled:opacity-50"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.161 22 16.403 22 12.017 22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                            </svg>
                            Continue with GitHub
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-px grow bg-slate-800/80"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">or use email</span>
                        <div className="h-px grow bg-slate-800/80"></div>
                    </div>

                    <form className="space-y-5 mb-8" onSubmit={handleSubmit}>
                        {isSignUp && (
                            <div className="space-y-2">
                                <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-emerald-400 ml-1">Full Name</label>
                                <input
                                    className="w-full h-13 px-5 bg-[#0b101a] border border-slate-800 rounded-xl text-white placeholder:text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    placeholder="John Doe"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-vibrant-secondary ml-1">Email Address</label>
                            <input
                                className="w-full h-13 px-5 vibrant-badge rounded-xl text-vibrant-primary focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-black placeholder:text-slate-400"
                                placeholder="name@company.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-vibrant-secondary">Password</label>
                                {!isSignUp && <a className="text-xs font-bold text-emerald-500 hover:underline" href="#">Forgot?</a>}
                            </div>
                            <div className="relative">
                                <input
                                    className="w-full h-13 px-5 vibrant-badge rounded-xl text-vibrant-primary focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all pr-12 font-black placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-500 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        <button
                            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-emerald-950 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:translate-y-0.5 disabled:opacity-50 pt-1"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                            {!loading && (
                                <svg height="20" width="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 dark:text-slate-400 font-bold text-sm">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        <button onClick={() => setIsSignUp(!isSignUp)} className="text-emerald-500 hover:underline ml-1">
                            {isSignUp ? 'Sign In' : 'Create an account'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
