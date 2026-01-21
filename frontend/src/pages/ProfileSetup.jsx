import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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

export default function ProfileSetup() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [username, setUsername] = useState('');
    const [isUsernameAvailable, setIsUsernameAvailable] = useState(null); // null, true, false
    const [role, setRole] = useState('Developer');
    const [selectedAvatar, setSelectedAvatar] = useState(avatar1);
    const [customAvatar, setCustomAvatar] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCustomAvatar(url);
            setSelectedAvatar(null); // Deselect preset if custom is uploaded
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 blur-[160px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-[500px] relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-12 h-12 bg-[#3b82f6] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                        <span className="material-symbols-outlined text-white text-[28px]">account_circle</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h2>
                    <p className="text-slate-500 font-medium text-center">Let your teammates know who you are</p>
                </div>

                <div className="bg-[#131b2b]/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 md:p-10 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            {error}
                        </div>
                    )}

                    <div className="space-y-10">
                        {/* Avatar Selection */}
                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 mb-6">Choose an Avatar</label>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                {presetAvatars.map((avatar, index) => (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            setSelectedAvatar(avatar);
                                            setCustomAvatar(null);
                                        }}
                                        className={`size-[64px] rounded-full p-0.5 relative cursor-pointer active:scale-95 transition-all ${selectedAvatar === avatar ? 'ring-[3px] ring-blue-500 ring-offset-[4px] ring-offset-[#0b101a]' : 'border border-slate-800 hover:border-slate-600'}`}
                                    >
                                        <div className="w-full h-full rounded-full bg-cover bg-center overflow-hidden">
                                            <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                        {selectedAvatar === avatar && (
                                            <div className="absolute -right-1 -bottom-1 bg-blue-500 rounded-full p-1 border-2 border-[#0b101a]">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Custom Avatar Upload */}
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    className={`size-[64px] rounded-full p-0.5 relative cursor-pointer active:scale-95 transition-all flex items-center justify-center ${customAvatar ? 'ring-[3px] ring-blue-500 ring-offset-[4px] ring-offset-[#0b101a]' : 'border-2 border-dashed border-slate-800 text-slate-700 hover:border-[#3b82f6] hover:text-[#3b82f6]'}`}
                                >
                                    {customAvatar ? (
                                        <div className="w-full h-full rounded-full bg-cover bg-center overflow-hidden">
                                            <img src={customAvatar} alt="Custom Avatar" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M3 7C3 5.89543 3.89543 5 5 5H7.5L9 3H15L16.5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                    {customAvatar && (
                                        <div className="absolute -right-1 -bottom-1 bg-blue-500 rounded-full p-1 border-2 border-[#0b101a]">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                        </div>

                        {/* Username Input */}
                        <div className="space-y-4">
                            <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">Choose Username</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 font-bold">@</span>
                                <input
                                    className="w-full h-13 pl-10 pr-32 bg-white dark:bg-black/40 backdrop-blur-2xl border border-emerald-500/20 dark:border-emerald-500/20 rounded-xl text-white placeholder:text-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all"
                                    placeholder="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                <div className={`absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.05em] ${isUsernameAvailable === true ? 'text-emerald-500' : isUsernameAvailable === false ? 'text-red-500' : 'text-slate-700'}`}>
                                    {isUsernameAvailable === true && <><span className="material-symbols-outlined text-[14px]">done</span>Available</>}
                                    {isUsernameAvailable === false && <><span className="material-symbols-outlined text-[14px]">close</span>Taken</>}
                                </div>
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-4">
                            <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">Primary Role</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Developer', 'Designer', 'Product', 'Marketing'].map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r)}
                                        className={`h-11 rounded-xl border-2 font-bold text-xs transition-all uppercase tracking-wider ${role === r ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-emerald-500/10 text-slate-600 hover:border-emerald-500/30'}`}
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
                            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-emerald-950 rounded-2xl font-black text-base transition-all shadow-lg shadow-emerald-500/30 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Complete Profile Setup'}
                            {!loading && (
                                <svg height="20" width="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
