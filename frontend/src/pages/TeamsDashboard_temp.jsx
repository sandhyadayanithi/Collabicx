import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { logout, getUserTeams } from '../firebase/functions';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';

export default function TeamsDashboard() {
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const [userData, setUserData] = useState(null);
    const [userTeams, setUserTeams] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                }

                // Fetch user's teams
                try {
                    const teams = await getUserTeams(user.uid);
                    setUserTeams(teams);
                } catch (error) {
                    console.error("Error fetching teams:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <div className="text-slate-900 dark:text-slate-100 font-display min-h-screen flex">
            {/* Sidebar Navigation */}
            <Sidebar
                showLogo={true}
                footer={
                    <>
                        <div
                            onClick={() => navigate('/profile')}
                            className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-emerald-300/80 hover:text-primary dark:hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                            <div
                                className="size-6 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-800"
                                style={{ backgroundImage: `url(${userData?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKjUQ66xDalBfRsaC936ij73oYH25Apri9FE6H6BODXUu6yDFtQCLf6dmmT4HPojEzYpJb6DxQRSa87aYM6wXtpd73Y29VWkJiqx2XfUT0oiGB0Y8hlQ1L1FQxYtQeNtcFtZGUfn-3lWBkgn8tesgpeKsvpLxCGUS5YNnELL55p1QZFeSc8C8t5V2MsuYqWbaf78d7yBszxR2Y2V4FulzYB4XgVVGQd747I7GFda_r1YdZZUAj34NUFGTMI7epdBJecOou6ca9pnR_'})` }}
                            ></div>
                            <p className="text-sm font-black">My Profile</p>
                        </div>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors cursor-pointer text-left">
                            <span className="material-symbols-outlined">logout</span>
                            <p className="text-sm font-black">Logout</p>
                        </button>
                    </>
                }
            >
                <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 dark:bg-emerald-500/20 border-l-[3px] border-primary dark:border-emerald-400 text-primary dark:text-emerald-400 transition-colors cursor-pointer" href="#">
                    <span className="material-symbols-outlined dark:text-emerald-400">groups</span>
                    <p className="text-sm font-black">My Teams</p>
                </a>
                <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-800 dark:text-emerald-300/80 hover:bg-slate-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer" href="#">
                    <span className="material-symbols-outlined dark:text-emerald-300/80">explore</span>
                    <p className="text-sm font-black">Discover</p>
                </a>
                <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-800 dark:text-emerald-300/80 hover:bg-slate-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer" href="#">
                    <span className="material-symbols-outlined dark:text-emerald-300/80">settings</span>
                    <p className="text-sm font-black">Account Settings</p>
                </a>
            </Sidebar>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col">
                {/* Header Section */}
                <header className="max-w-[1200px] w-full mx-auto px-8 pt-10 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-slate-900 text-white-forced text-4xl font-black tracking-tight">All Teams Dashboard</h2>
                            <p className="text-slate-600 text-white-forced-dim font-black">Manage and organize your collaborative hackathon projects.</p>
                        </div>
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate('/teams/select')}
                                className="flex items-center gap-2 px-5 h-11 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold transition-all shadow-lg shadow-primary/20 cursor-pointer"
                            >
                                <span className="material-symbols-outlined">add</span>
                                <span>Create New Team</span>
                            </button>

                            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>

                            <button
                                onClick={toggleTheme}
                                className="size-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary transition-all active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {isDarkMode ? 'light_mode' : 'dark_mode'}
                                </span>
                            </button>
                        </div>
                    </div>
                    {/* Search/Filter Bar */}
                    <div className="mt-8">
                        <label className="relative block w-full max-w-md">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <span className="material-symbols-outlined">search</span>
                            </span>
                            <input className="block w-full bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-emerald-500/20 dark:border-emerald-500/20 rounded-xl py-3 pl-11 pr-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm placeholder:text-slate-500 dark:placeholder:text-emerald-100/40 dark:text-white font-black" name="search" placeholder="Search teams by name or project..." type="text" />
                        </label>
                    </div>
                </header>

                {/* Team Grid Section */}
                <section className="max-w-[1200px] w-full mx-auto px-8 py-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : userTeams.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">groups</span>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Teams Yet</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">Create your first team to start collaborating!</p>
                            <button
                                onClick={() => navigate('/teams/select')}
                                className="flex items-center gap-2 px-6 h-12 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold transition-all shadow-lg shadow-primary/20"
                            >
                                <span className="material-symbols-outlined">add</span>
                                <span>Create Team</span>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {userTeams.map((team) => (
                                <div
                                    key={team.id}
                                    onClick={() => navigate('/dashboard')}
                                    className="group bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-emerald-500/20 dark:border-emerald-500/20 rounded-xl p-6 transition-all hover:shadow-xl hover:border-primary/40 flex flex-col items-center text-center cursor-pointer"
                                >
                                    <div className="mb-4 relative">
                                        <div className="size-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full border-4 border-slate-100 dark:border-slate-700 shadow-inner flex items-center justify-center">
                                            <span className="material-symbols-outlined text-4xl text-primary">groups</span>
                                        </div>
                                        <div className="absolute bottom-0 right-0 size-6 bg-green-500 rounded-full border-4 border-white dark:border-[#1e293b]"></div>
                                    </div>
                                    <h3 className="text-slate-900 dark:text-white text-lg font-black mb-1 group-hover:text-primary transition-colors">
                                        {team.name}
                                    </h3>
                                    {team.description && (
                                        <p className="text-slate-500 dark:text-slate-400 text-xs mb-3 line-clamp-2">{team.description}</p>
                                    )}
                                    <div className="flex flex-col gap-2 mt-2 w-full">
                                        <div className="inline-flex items-center justify-center px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs font-black rounded-full shadow-sm">
                                            Code: {team.joinCode}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
