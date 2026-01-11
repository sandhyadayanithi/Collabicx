import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    googleSignIn,
    loginWithEmail,
    signUpWithEmail,
    checkUsernameAvailability,
    updateUserProfile
} from '../firebase/functions';
import { auth } from '../firebase/config';

// Import Avatars
import avatar1 from '../assets/avatars/avatar1.png';
import avatar2 from '../assets/avatars/avatar2.png';
import avatar3 from '../assets/avatars/avatar3.png';
import avatar4 from '../assets/avatars/avatar4.png';
import avatar5 from '../assets/avatars/avatar5.png';

export default function Login() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [pageStage, setPageStage] = useState('landing'); // 'landing' or 'auth'
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Profile Setup States
    const [username, setUsername] = useState('');
    const [isUsernameAvailable, setIsUsernameAvailable] = useState(null); // null, true, false
    const [role, setRole] = useState('Developer');
    const [selectedAvatar, setSelectedAvatar] = useState(avatar1);
    const [customAvatar, setCustomAvatar] = useState(null);

    const presetAvatars = [avatar1, avatar2, avatar3, avatar4, avatar5];

    // Username Availability Check Logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (username.length >= 3) {
                const available = await checkUsernameAvailability(username);
                setIsUsernameAvailable(available);
            } else {
                setIsUsernameAvailable(null);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isSignUp) {
                await signUpWithEmail(email, password, name);
                // After signup, the user is logged in. 
                // In v0 we stay on page to show the "Complete Profile" part
                // The profile section is already visible in the sidebar.
            } else {
                await loginWithEmail(email, password);
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
            navigate('/teams');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteSetup = async () => {
        if (!auth.currentUser) {
            setError('Please sign in first');
            return;
        }
        if (isUsernameAvailable === false || username.length < 3) {
            setError('Please choose a valid and available username');
            return;
        }

        setLoading(true);
        try {
            await updateUserProfile(auth.currentUser.uid, {
                username: username.toLowerCase(),
                role,
                avatar: customAvatar || selectedAvatar
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCustomAvatar(url);
            setSelectedAvatar(null); // Deselect preset if custom is uploaded
        }
    };

    return (
        <div className="bg-[#0b101a] font-display text-white min-h-screen flex items-stretch selection:bg-primary/30">
            {/* Left Side: Branding and Illustration - TOP ALIGNED */}
            <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] bg-[#0b101a] relative overflow-hidden flex-col items-start px-12 xl:px-32 pt-20">
                <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-1000">
                    <div className="flex items-center gap-3 mb-16">
                        <div className="w-10 h-10 bg-[#3b82f6] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="material-symbols-outlined text-white text-[24px]">hub</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-white">Collabicx</span>
                    </div>

                    <div className="max-w-2xl text-left">
                        <h1 className="text-[64px] xl:text-[84px] font-black leading-[1.05] tracking-[-0.05em] text-white mb-8">
                            Build the <span className="text-[#3b82f6]">Future</span> Together
                        </h1>
                        <p className="text-xl text-slate-400 font-medium leading-relaxed mb-16 max-w-lg">
                            The ultimate collaborative platform for modern hackathons. Organize projects, track progress, and communicate with your team in real-time.
                        </p>

                        <div className="w-full max-w-lg aspect-[1.6/1] rounded-[32px] bg-[#1a2133] border border-slate-800/80 shadow-2xl overflow-hidden flex flex-col p-8 group transition-transform hover:scale-[1.02] duration-500">
                            <div className="flex gap-2.5 mb-8">
                                <div className="w-3.5 h-3.5 rounded-full bg-slate-800"></div>
                                <div className="w-3.5 h-3.5 rounded-full bg-slate-800"></div>
                                <div className="w-3.5 h-3.5 rounded-full bg-slate-800"></div>
                            </div>
                            <div className="flex flex-col gap-5">
                                <div className="flex items-center gap-3 text-[#3b82f6]/40">
                                    <span className="material-symbols-outlined text-[48px]">terminal</span>
                                </div>
                                <div className="flex flex-col gap-3.5 ml-2">
                                    <div className="h-2.5 w-28 bg-slate-800 rounded-full"></div>
                                    <div className="h-2.5 w-52 bg-slate-800 rounded-full"></div>
                                    <div className="h-2.5 w-36 bg-slate-800 rounded-full"></div>
                                </div>
                            </div>
                            <div className="mt-auto flex items-center gap-3 ml-2">
                                <div className="h-3 w-3 bg-[#3b82f6] rounded-sm animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                <div className="h-2 w-20 bg-slate-800/50 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Flow Form */}
            <div className="w-full lg:w-[45%] xl:w-[40%] bg-[#0b101a] border-l border-slate-900/50 overflow-y-auto custom-scrollbar relative flex flex-col">
                {pageStage === 'landing' ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <button
                            onClick={() => setPageStage('auth')}
                            className="w-full max-w-[280px] h-16 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-2xl font-black text-lg transition-all shadow-2xl shadow-blue-500/30 active:scale-[0.98] animate-in zoom-in-95 duration-500"
                        >
                            Login / Sign Up
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col min-h-full p-8 md:p-16 xl:p-20 space-y-24 animate-in fade-in slide-in-from-right-8 duration-700">
                        {/* Section 1: Welcome Back */}
                        <section className="w-full max-w-[400px] mx-auto">
                            <div className="mb-10">
                                <h2 className="text-[34px] font-bold text-white mb-2 leading-tight">Welcome Back</h2>
                                <p className="text-slate-500 font-medium">Please enter your details to sign in</p>
                            </div>

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

                            <button
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="w-full h-14 flex items-center justify-center gap-3 bg-[#131b2b] border border-slate-800 rounded-xl text-white font-bold transition-all hover:bg-slate-800 group disabled:opacity-50"
                            >
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                                </svg>
                                Sign in with Google
                            </button>

                            <div className="flex items-center gap-4 my-8">
                                <div className="h-px grow bg-slate-800/80"></div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">or use email</span>
                                <div className="h-px grow bg-slate-800/80"></div>
                            </div>

                            <form className="space-y-6 mb-8" onSubmit={handleSubmit}>
                                {isSignUp && (
                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">Full Name</label>
                                        <input
                                            className="w-full h-14 px-5 bg-[#131b2b] border border-slate-800 rounded-xl text-white placeholder:text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                            placeholder="John Doe"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}
                                <div className="space-y-3">
                                    <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">Email Address</label>
                                    <input
                                        className="w-full h-14 px-5 bg-[#131b2b] border border-slate-800 rounded-xl text-white placeholder:text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                        placeholder="name@company.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">Password</label>
                                        {!isSignUp && <a className="text-xs font-bold text-[#3b82f6] hover:underline" href="#">Forgot password?</a>}
                                    </div>
                                    <div className="relative">
                                        <input
                                            className="w-full h-14 px-5 bg-[#131b2b] border border-slate-800 rounded-xl text-white placeholder:text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all pr-12"
                                            placeholder="••••••••"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-500 transition-colors"
                                        >
                                            {showPassword ? (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            ) : (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    className="w-full h-14 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:translate-y-0.5 disabled:opacity-50"
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

                            <p className="text-center text-slate-500 font-bold text-sm">
                                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                                <button onClick={() => setIsSignUp(!isSignUp)} className="text-[#3b82f6] hover:underline ml-1">
                                    {isSignUp ? 'Sign In' : 'Create an account'}
                                </button>
                            </p>
                        </section>

                        <div className="w-full max-w-[400px] mx-auto h-px bg-slate-900/80"></div>

                        {/* Section 2: Complete Your Profile */}
                        <section className="w-full max-w-[400px] mx-auto">
                            <div className="mb-12">
                                <h2 className="text-[34px] font-bold text-white mb-2 leading-tight">Complete Your Profile</h2>
                                <p className="text-slate-500 font-medium">Let your teammates know who you are</p>
                            </div>

                            <div className="space-y-12">
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 mb-6">Choose an Avatar</label>
                                    <div className="flex flex-wrap gap-5">
                                        {presetAvatars.map((avatar, index) => (
                                            <div
                                                key={index}
                                                onClick={() => {
                                                    setSelectedAvatar(avatar);
                                                    setCustomAvatar(null);
                                                }}
                                                className={`size-[72px] rounded-full p-0.5 relative cursor-pointer active:scale-95 transition-all ${selectedAvatar === avatar ? 'ring-[3px] ring-blue-500 ring-offset-[4px] ring-offset-[#0b101a]' : 'border border-slate-800 hover:border-slate-600'}`}
                                            >
                                                <div className="w-full h-full rounded-full bg-cover bg-center overflow-hidden">
                                                    <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                                                </div>
                                                {selectedAvatar === avatar && (
                                                    <div className="absolute inset-0 bg-blue-500/10 rounded-full flex items-center justify-center">
                                                        <svg className="text-white drop-shadow-md" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Custom Avatar Upload Circle */}
                                        <div
                                            onClick={() => fileInputRef.current.click()}
                                            className={`size-[72px] rounded-full p-0.5 relative cursor-pointer active:scale-95 transition-all flex items-center justify-center ${customAvatar ? 'ring-[3px] ring-blue-500 ring-offset-[4px] ring-offset-[#0b101a]' : 'border-2 border-dashed border-slate-800 text-slate-700 hover:border-[#3b82f6] hover:text-[#3b82f6]'}`}
                                        >
                                            {customAvatar ? (
                                                <div className="w-full h-full rounded-full bg-cover bg-center overflow-hidden">
                                                    <img src={customAvatar} alt="Custom Avatar" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M3 7C3 5.89543 3.89543 5 5 5H7.5L9 3H15L16.5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                            {customAvatar && (
                                                <div className="absolute inset-0 bg-blue-500/10 rounded-full flex items-center justify-center">
                                                    <svg className="text-white drop-shadow-md" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">Choose Username</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 font-bold">@</span>
                                        <input
                                            className="w-full h-14 pl-10 pr-32 bg-[#131b2b] border border-slate-800 rounded-xl text-white placeholder:text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                            placeholder="username"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                        <div className={`absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.05em] ${isUsernameAvailable === true ? 'text-emerald-500' : isUsernameAvailable === false ? 'text-red-500' : 'text-slate-700'}`}>
                                            {isUsernameAvailable === true && (
                                                <>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    Available
                                                </>
                                            )}
                                            {isUsernameAvailable === false && (
                                                <>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    Not available
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-600 font-bold leading-relaxed px-1">Your unique handle for mentions and profile.</p>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">Primary Role</label>
                                    <div className="grid grid-cols-2 gap-3.5">
                                        {['Developer', 'Designer', 'Product', 'Marketing'].map((r) => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setRole(r)}
                                                className={`h-11 rounded-xl border-2 font-bold text-xs transition-all uppercase tracking-wider ${role === r ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6]' : 'border-slate-800/80 text-slate-600 hover:border-slate-700'}`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCompleteSetup}
                                    disabled={loading}
                                    className="w-full h-14 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-blue-500/30 active:translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : 'Complete Setup'}
                                    {!loading && (
                                        <svg height="20" width="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </section>

                        <footer className="w-full max-w-[400px] mx-auto pt-16 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black text-slate-700 uppercase tracking-[0.15em]">
                            <div className="flex gap-8">
                                <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
                                <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
                            </div>
                            <span>© 2024 Collabicx Inc.</span>
                        </footer>
                    </div>
                )}
            </div>
        </div>
    );
}
