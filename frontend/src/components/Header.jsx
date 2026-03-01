import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';

export default function Header({ title = "Team Dashboard", backPath = "/teams", children, ideaContent, onAddIdea }) {
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const [userData, setUserData] = React.useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const hideTimerRef = useRef(null);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                }
            } else {
                setUserData(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleMouseEnterTitle = () => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        setShowPopup(true);
    };

    const handleMouseLeaveTitle = () => {
        hideTimerRef.current = setTimeout(() => setShowPopup(false), 150);
    };

    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-300 dark:border-white/10 px-6 lg:px-10 py-3 bg-white dark:bg-slate-900/80 backdrop-blur-2xl sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(backPath)}
                    className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <Link to="/teams" className="flex items-center gap-1 text-primary hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="Collabicx" className="size-14 object-contain" />
                    <h2 className="text-emerald-900 dark:text-emerald-400 text-xl font-black leading-tight tracking-tight">Collabicx</h2>
                </Link>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 ml-2"></div>

                {/* Hoverable title with idea popup */}
                <div className="relative hidden md:block" onMouseEnter={handleMouseEnterTitle} onMouseLeave={handleMouseLeaveTitle}>
                    <h1 className="text-black dark:text-white font-black text-lg cursor-default select-none">
                        {title}
                    </h1>

                    {/* Idea Popup */}
                    {showPopup && (
                        <div
                            className="absolute left-0 top-full mt-2 w-80 z-[200] animate-in fade-in slide-in-from-top-1 duration-150"
                            onMouseEnter={handleMouseEnterTitle}
                            onMouseLeave={handleMouseLeaveTitle}
                        >
                            <div
                                className="rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                                style={{
                                    background: 'rgba(10, 25, 20, 0.85)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                }}
                            >
                                {ideaContent ? (
                                    <div className="p-4">
                                        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                            {ideaContent}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 flex items-center justify-center">
                                        <button
                                            onClick={() => { setShowPopup(false); onAddIdea?.(); }}
                                            className="text-emerald-400/80 hover:text-emerald-400 text-sm font-bold underline underline-offset-2 decoration-emerald-500/40 hover:decoration-emerald-400 transition-all flex items-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">add</span>
                                            Add idea
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center gap-8">
                {children}
            </div>

            <div className="flex items-center gap-6">
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

                <button
                    onClick={toggleTheme}
                    className="size-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined text-[20px]">
                        {isDarkMode ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>

                <div
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                >
                    <div className="hidden md:flex flex-col items-end">
                        <p className="text-xs font-black text-black dark:text-white leading-none mb-1">
                            {userData?.username ? `@${userData.username}` : (userData?.name || 'User')}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-emerald-400/80 leading-none opacity-60 uppercase tracking-wider">
                            {userData?.role || 'Member'}
                        </p>
                    </div>
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 border-2 border-slate-200 dark:border-slate-800 group-hover:border-primary transition-colors"
                        style={{ backgroundImage: `url(${userData?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKjUQ66xDalBfRsaC936ij73oYH25Apri9FE6H6BODXUu6yDFtQCLf6dmmT4HPojEzYpJb6DxQRSa87aYM6wXtpd73Y29VWkJiqx2XfUT0oiGB0Y8hlQ1L1FQxYtQeNtcFtZGUfn-3lWBkgn8tesgpeKsvpLxCGUS5YNnELL55p1QZFeSc8C8t5V2MsuYqWbaf78d7yBszxR2Y2V4FulzYB4XgVVGQd747I7GFda_r1YdZZUAj34NUFGTMI7epdBJecOou6ca9pnR_'})` }}
                    ></div>
                </div>
            </div>
        </header>
    );
}
