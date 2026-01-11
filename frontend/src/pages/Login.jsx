import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleSignIn, loginWithEmail, signUpWithEmail } from '../firebase/functions';

export default function Login() {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
                navigate('/dashboard');
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
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen flex items-stretch">
            {/* Left Side: Branding and Illustration */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-background-dark relative overflow-hidden flex-col justify-center px-12 xl:px-24">
                {/* Abstract Tech Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-purple blur-[120px]"></div>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-12">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-white">hub</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">DevSprint</span>
                    </div>
                    <div className="max-w-xl">
                        <h1 className="text-5xl xl:text-7xl font-black leading-tight tracking-[-0.033em] text-white mb-6">
                            Build the <span className="text-primary">Future</span> Together
                        </h1>
                        <p className="text-lg xl:text-xl text-slate-400 font-normal leading-relaxed mb-8">
                            The ultimate collaborative platform for modern hackathons. Organize projects, track progress, and communicate with your team in real-time.
                        </p>
                        <div className="aspect-video w-full rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm overflow-hidden flex items-center justify-center relative shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10"></div>
                            <div className="flex flex-col items-center gap-4 text-slate-500">
                                <span className="material-symbols-outlined text-6xl text-primary/60">terminal</span>
                                <div className="flex gap-2">
                                    <div className="h-2 w-12 bg-slate-700 rounded-full"></div>
                                    <div className="h-2 w-24 bg-slate-700 rounded-full"></div>
                                    <div className="h-2 w-16 bg-slate-700 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 bg-background-light dark:bg-background-dark">
                <div className="w-full max-w-[440px]">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            {isSignUp ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            {isSignUp ? 'Join the community of innovators' : 'Please enter your details to sign in'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            {error}
                        </div>
                    )}

                    <div className="mb-8">
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-[#3b4354] rounded-lg text-slate-700 dark:text-white font-semibold transition-all hover:bg-slate-50 dark:hover:bg-[#252a35] shadow-sm disabled:opacity-50"
                        >
                            <div className="w-5 h-5 flex items-center justify-center">
                                <svg className="w-full h-full" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                                </svg>
                            </div>
                            {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-px grow bg-slate-200 dark:bg-[#3b4354]"></div>
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">or use email</span>
                        <div className="h-px grow bg-slate-200 dark:bg-[#3b4354]"></div>
                    </div>

                    <form className="space-y-6 mb-8" onSubmit={handleSubmit}>
                        {isSignUp && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                                <input
                                    className="w-full px-4 py-3.5 bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-[#3b4354] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="John Doe"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                            <input
                                className="w-full px-4 py-3.5 bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-[#3b4354] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                placeholder="name@company.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                                {!isSignUp && <a className="text-sm font-medium text-primary hover:underline" href="#">Forgot password?</a>}
                            </div>
                            <div className="relative">
                                <input
                                    className="w-full px-4 py-3.5 bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-[#3b4354] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    placeholder="••••••••"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" type="button">
                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                </button>
                            </div>
                        </div>
                        <button
                            className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold text-lg shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                            {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 dark:text-slate-400">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-primary font-semibold hover:underline ml-1"
                        >
                            {isSignUp ? 'Sign In' : 'Create an account'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
