import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import {
    checkUsernameAvailability,
    updateUserProfile,
    logout
} from '../firebase/functions';
import { auth, db } from '../firebase/config';

// Import Avatars
import avatar1 from '../assets/avatars/avatar1.png';
import avatar2 from '../assets/avatars/avatar2.png';
import avatar3 from '../assets/avatars/avatar3.png';
import avatar4 from '../assets/avatars/avatar4.png';
import avatar5 from '../assets/avatars/avatar5.png';

export default function ProfileSetup() {
    const navigate = useNavigate();
    const [profession, setProfession] = useState('Student');
    const [username, setUsername] = useState('');
    const [initialUsername, setInitialUsername] = useState('');
    const [isUsernameAvailable, setIsUsernameAvailable] = useState(null); // null, true, false
    const [role, setRole] = useState('Developer');
    const [college, setCollege] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(avatar1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);

    const presetAvatars = [avatar1, avatar2, avatar3, avatar4, avatar5];

    // Auth Check
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const snap = await getDoc(doc(db, "users", currentUser.uid));
                    if (snap.exists()) {
                        const data = snap.data();
                        if (data.username) {
                            setUsername(data.username);
                            setInitialUsername(data.username);
                            setIsUsernameAvailable(true);
                        }
                        if (data.role) setRole(data.role);
                        if (data.avatar) setSelectedAvatar(data.avatar);
                        if (data.profession) setProfession(data.profession);
                        if (data.college) setCollege(data.college);
                    }
                } catch (err) {
                    console.error("Error fetching user data", err);
                }
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    // College Detection Logic
    useEffect(() => {
        if (profession === 'Student' && user?.email && !college) {
            const domain = user.email.split('@')[1]?.toLowerCase();
            const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'zoho.com', 'yandex.com', 'protonmail.com'];

            if (!personalDomains.includes(domain)) {
                const fetchCollege = async () => {
                    try {
                        const response = await fetch(`http://universities.hipolabs.com/search?domain=${domain}`);
                        if (response.ok) {
                            const data = await response.json();
                            if (data && data.length > 0) {
                                setCollege(data[0].name);
                            } else {
                                // Fallback
                                const prefix = domain.split('.')[0];
                                setCollege(prefix.charAt(0).toUpperCase() + prefix.slice(1) + " University");
                            }
                        }
                    } catch (err) {
                        console.error("Error fetching college name:", err);
                    }
                };
                fetchCollege();
            }
        }
    }, [profession, user, college]);

    // Username Availability Check Logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (username.length >= 3) {
                if (initialUsername && username.toLowerCase() === initialUsername.toLowerCase()) {
                    setIsUsernameAvailable(true);
                    return;
                }
                try {
                    const available = await checkUsernameAvailability(username);
                    setIsUsernameAvailable(available);
                } catch (err) {
                    console.error("Username check failed", err);
                    setIsUsernameAvailable(null);
                }
            } else {
                setIsUsernameAvailable(null);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username, initialUsername]);

    const handleCompleteSetup = async () => {
        if (!user) {
            setError('Please sign in first');
            return;
        }

        // Strict check: Must be explicitly true
        if (isUsernameAvailable !== true) {
            setError('Please choose a valid and available username');
            return;
        }

        if (profession === 'Student') {
            const email = user.email || "";
            const domain = email.split('@')[1]?.toLowerCase();
            const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'zoho.com', 'yandex.com', 'protonmail.com'];
            if (personalDomains.includes(domain)) {
                try {
                    await logout();
                } catch (err) {
                    console.error('Logout error:', err);
                }
                navigate('/login', { state: { error: 'Student accounts require a valid college-issued email address. Please sign in with your college email.' } });
                return;
            }
        }

        setLoading(true);
        setError('');

        try {
            // Explicitly ensure Firebase Auth is ready and user is available
            const currentUser = auth.currentUser;
            if (!currentUser) {
                setError('Authentication state is not ready. Please try again in a moment.');
                setLoading(false);
                return;
            }

            const idToken = await currentUser.getIdToken(true); // Force refresh to get a fresh token
            const response = await fetch('http://localhost:4000/api/auth/verify-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    username: username.toLowerCase(),
                    role,
                    avatar: selectedAvatar,
                    profession
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Backend error details:", data);
                throw new Error(data.details || data.error || 'Failed to verify role and update profile.');
            }

            navigate('/teams');
        } catch (err) {
            console.error("Profile setup error:", err);
            setError(err.message || "Failed to update profile. Please try again.");
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
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Complete Your Profile</h2>
                    <p className="text-slate-500 dark:text-slate-300 font-medium text-center">Let your teammates know who you are</p>
                </div>

                <div className="vibrant-card border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 md:p-10 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">error</span>
                            {error}
                        </div>
                    )}

                    <div className="space-y-10">
                        {/* Avatar Selection */}
                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-vibrant-secondary mb-6">Choose an Avatar</label>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                {presetAvatars.map((avatar, index) => (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            setSelectedAvatar(avatar);
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
                            </div>
                        </div>

                        {/* Username Input */}
                        <div className="space-y-4">
                            <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-vibrant-secondary">Choose Username</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 font-bold">@</span>
                                <input
                                    className="w-full h-13 pl-10 pr-32 vibrant-badge rounded-xl text-vibrant-primary placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-black"
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

                        {/* profession Selection */}
                        <div className="space-y-4 mb-4">
                            <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-vibrant-secondary">How will you be using Collabix?</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setProfession('Student')}
                                    className={`h-11 rounded-xl border-2 font-black text-xs transition-all uppercase tracking-wider ${profession === 'Student' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-inner shadow-emerald-500/20' : 'vibrant-role-button hover:border-emerald-500/30'}`}
                                >
                                    Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProfession('Other')}
                                    className={`h-11 rounded-xl border-2 font-black text-xs transition-all uppercase tracking-wider ${profession === 'Other' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-inner shadow-emerald-500/20' : 'vibrant-role-button hover:border-emerald-500/30'}`}
                                >
                                    Professional / Other
                                </button>
                            </div>
                        </div>

                        {/* College Info (Read-only for Student) */}
                        {profession === 'Student' && (
                            <div className="space-y-4">
                                <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-vibrant-secondary">Institution</label>
                                <div className="w-full h-13 px-5 flex items-center bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-500/80 font-black text-sm">
                                    <span className="material-symbols-outlined text-[18px] mr-2">school</span>
                                    {college || "Detecting institution..."}
                                </div>
                                <p className="text-[10px] text-vibrant-secondary font-bold px-1 italic">
                                    * Institution is automatically verified based on your email.
                                </p>
                            </div>
                        )}

                        {/* Role Selection */}
                        <div className="space-y-4">
                            <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-vibrant-secondary">Primary Role</label>
                            <div className="grid grid-cols-2 gap-3">
                                {['Developer', 'Designer', 'Product', 'Marketing'].map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r)}
                                        className={`h-11 rounded-xl border-2 font-black text-xs transition-all uppercase tracking-wider ${role === r ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-inner shadow-emerald-500/20' : 'vibrant-role-button hover:border-emerald-500/30'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleCompleteSetup}
                            disabled={loading || isUsernameAvailable !== true}
                            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-emerald-950 rounded-2xl font-black text-base transition-all shadow-lg shadow-emerald-500/30 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
