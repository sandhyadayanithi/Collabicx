import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { logout } from '../firebase/functions';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';

export default function TeamsDashboard() {
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const [userData, setUserData] = React.useState(null);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserData(userSnap.data());
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
                        <a className="flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-black hover:text-primary transition-colors cursor-pointer" href="#">
                            <span className="material-symbols-outlined dark:text-black">help_outline</span>
                            <p className="text-sm font-black">Help Center</p>
                        </a>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors cursor-pointer text-left">
                            <span className="material-symbols-outlined">logout</span>
                            <p className="text-sm font-black">Logout</p>
                        </button>
                    </>
                }
            >
                <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 border-l-[3px] border-primary text-primary transition-colors cursor-pointer" href="#">
                    <span className="material-symbols-outlined dark:text-black">groups</span>
                    <p className="text-sm font-black">My Teams</p>
                </a>
                <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-800 dark:text-black hover:bg-slate-100 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer" href="#">
                    <span className="material-symbols-outlined dark:text-black">explore</span>
                    <p className="text-sm font-black">Discover</p>
                </a>
                <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-800 dark:text-black hover:bg-slate-100 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer" href="#">
                    <span className="material-symbols-outlined dark:text-black">settings</span>
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

                            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>

                            <div
                                onClick={() => navigate('/profile')}
                                className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                            >
                                <div className="hidden md:flex flex-col items-end">
                                    <p className="text-xs font-black text-slate-900 text-white-forced leading-none mb-1">
                                        {userData?.username ? `@${userData.username}` : (userData?.name || 'User')}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-500 text-white-forced-dim uppercase tracking-wider leading-none">
                                        {userData?.role || 'Member'}
                                    </p>
                                </div>
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-slate-200 dark:border-slate-800 group-hover:border-primary transition-colors"
                                    style={{ backgroundImage: `url(${userData?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKjUQ66xDalBfRsaC936ij73oYH25Apri9FE6H6BODXUu6yDFtQCLf6dmmT4HPojEzYpJb6DxQRSa87aYM6wXtpd73Y29VWkJiqx2XfUT0oiGB0Y8hlQ1L1FQxYtQeNtcFtZGUfn-3lWBkgn8tesgpeKsvpLxCGUS5YNnELL55p1QZFeSc8C8t5V2MsuYqWbaf78d7yBszxR2Y2V4FulzYB4XgVVGQd747I7GFda_r1YdZZUAj34NUFGTMI7epdBJecOou6ca9pnR_'})` }}
                                ></div>
                            </div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Team Card 1 - Code Wizards */}
                        <div onClick={() => navigate('/dashboard')} className="group bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-emerald-500/20 dark:border-emerald-500/20 rounded-xl p-6 transition-all hover:shadow-xl hover:border-primary/40 flex flex-col items-center text-center cursor-pointer">
                            <div className="mb-4 relative">
                                <div className="size-20 bg-center bg-no-repeat bg-cover rounded-full border-4 border-slate-100 dark:border-slate-700 shadow-inner" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCCZQZxQTQTRXuH1zmS6KDScCTzc3ll_tHSdd4DYorf2J9b4SbW_9gc6dyubeJAB395fVuECjaNp1vBoKw_BBNfAL65dn-BVTVBlv2edGRZZ8ynHAKXzzZjmx1ggSEUDby2Tkxe1mSbuyb4HBQwzL0uyK7F6dp-eBFHNJv7S1WBWaqw1dr8NdoAvF_C8M3RDXCbug724ZwXBJ5ameE_gbrYWbNfj5T-xxiT7sAlCdP5FyQJ4JHM7pz4cYN3gzVK8YGloDqOOX38azpB')" }}></div>
                                <div className="absolute bottom-0 right-0 size-6 bg-green-500 rounded-full border-4 border-white dark:border-[#1e293b]"></div>
                            </div>
                            <h3 className="text-slate-900 dark:text-black text-lg font-black mb-1 group-hover:text-primary transition-colors">
                                Code Wizards
                            </h3>
                            <div className="flex flex-col gap-2 mt-2 w-full">
                                <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-black/70 text-sm font-black">
                                    <span className="material-symbols-outlined text-xs">group</span>
                                    8 Members
                                </div>
                                <div className="inline-flex items-center justify-center px-3 py-1 bg-emerald-100 dark:bg-white text-emerald-800 dark:text-black text-xs font-black rounded-full shadow-sm">
                                    2 Active Hackathons
                                </div>
                            </div>
                        </div>

                        {/* Team Card 2 - Byte Busters */}
                        <div onClick={() => navigate('/dashboard')} className="group bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-emerald-500/20 dark:border-emerald-500/20 rounded-xl p-6 transition-all hover:shadow-xl hover:border-primary/40 flex flex-col items-center text-center cursor-pointer">
                            <div className="mb-4 relative">
                                <div className="size-20 bg-center bg-no-repeat bg-cover rounded-full border-4 border-slate-100 dark:border-slate-700 shadow-inner" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBSvwOEJnkgqJCXmJ2T7bYu3370DNJyJIBHUaiOQzQ3FoiWhUcXSNI4Gq_fJEP_71emU-2dX9w79CyLdq2TCQxTlOZx2R_foKJZO58-g-NdsZOoLB57w6Gd4Dn7Bbz_lyl92oefa7Fth9qXDhxP_nUSxeh1vTI4q65zvblYMVYGqdjeywt3M6XKhBJWS0hAECThAnjywLRfAqLEJdLEK_QOU8jgLOFIJZg-NNHg99SRZWoYgWtoiQoudse-wqGf_wKOiehVwmCWjdvN')" }}></div>
                            </div>
                            <h3 className="text-slate-900 dark:text-white text-lg font-black mb-1 group-hover:text-primary transition-colors">Byte Busters</h3>
                            <div className="flex flex-col gap-2 mt-2 w-full">
                                <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-black/70 text-sm font-black">
                                    <span className="material-symbols-outlined text-xs">group</span>
                                    12 Members
                                </div>
                                <div className="inline-flex items-center justify-center px-3 py-1 bg-emerald-100 dark:bg-white text-emerald-800 dark:text-black text-xs font-black rounded-full shadow-sm">
                                    1 Active Hackathon
                                </div>
                            </div>
                        </div>

                        {/* Team Card 3 - Neural Knights */}
                        <div onClick={() => navigate('/dashboard')} className="group bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-emerald-500/20 dark:border-emerald-500/20 rounded-xl p-6 transition-all hover:shadow-xl hover:border-primary/40 flex flex-col items-center text-center cursor-pointer">
                            <div className="mb-4 relative">
                                <div className="size-20 bg-center bg-no-repeat bg-cover rounded-full border-4 border-slate-100 dark:border-slate-700 shadow-inner" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDPbFEpuQFcqyIx7eElCeooIiGHBK53crocg_4zoZ_uSIGoFlSL4cCfcuojPJcSD-q4-lQW2wnW55R3zefKcNoulygG8AStwxUPUkEK5ijjyvjff695pro_CqeavQ-7kkaKxeh3h7rwjjbhGgPoBQN7TQ2wsOrY6GodRjQlC6JkjYIXBHWlGg3EpHSjAim4LCAJzWPNX6Y1uHgBiivOo59XX4DRttutvyvgFzqoCiXjsmdTkXmaqsy3_gYOusWybpbGTeFTof9hSniQ')" }}></div>
                                <div className="absolute bottom-0 right-0 size-6 bg-green-500 rounded-full border-4 border-white dark:border-[#1e293b]"></div>
                            </div>
                            <h3 className="text-slate-900 dark:text-white text-lg font-black mb-1 group-hover:text-primary transition-colors">Neural Knights</h3>
                            <div className="flex flex-col gap-2 mt-2 w-full">
                                <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-black/70 text-sm font-black">
                                    <span className="material-symbols-outlined text-xs">group</span>
                                    5 Members
                                </div>
                                <div className="inline-flex items-center justify-center px-3 py-1 bg-emerald-100 dark:bg-white text-emerald-800 dark:text-black text-xs font-black rounded-full shadow-sm">
                                    4 Active Hackathons
                                </div>
                            </div>
                        </div>

                        {/* Team Card 4 - Data Drifters */}
                        <div onClick={() => navigate('/dashboard')} className="group bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-emerald-500/20 dark:border-emerald-500/20 rounded-xl p-6 transition-all hover:shadow-xl hover:border-primary/40 flex flex-col items-center text-center cursor-pointer">
                            <div className="mb-4 relative">
                                <div className="size-20 bg-center bg-no-repeat bg-cover rounded-full border-4 border-slate-100 dark:border-slate-700 shadow-inner" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBjD5B7AnPv6OrkzW7ZuEAsTzwZ90RyPJ5hQHSFBhFqP3l6VsjfBKM-a-KOS1WWCilA5BSQGk7QSKh8AViKi6UTIuyTwVNemIyEtynahJ4IaKpAStTvXgNtCDfKTqgqZmRMVU3bfJ6_iBThpx16T_0OmhcT3O_WFWp5jISQibwO1KQh4yd53bUUCp8fg6w8hb2vCvUT27vT8frPMIDSRK6xFJk6gIOZog_UqkLxTRY-2x9ofUqF258AF9AzNup11vxDkvWTB_2M5iaS')" }}></div>
                            </div>
                            <h3 className="text-slate-900 dark:text-white text-lg font-black mb-1 group-hover:text-primary transition-colors">Data Drifters</h3>
                            <div className="flex flex-col gap-2 mt-2 w-full">
                                <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-black/70 text-sm font-black">
                                    <span className="material-symbols-outlined text-xs">group</span>
                                    9 Members
                                </div>
                                <div className="inline-flex items-center justify-center px-3 py-1 bg-emerald-100 dark:bg-white text-emerald-800 dark:text-black text-xs font-black rounded-full shadow-sm">
                                    0 Active Hackathons
                                </div>
                            </div>
                        </div>

                        {/* Team Card 5 - Cloud Commanders */}
                        <div onClick={() => navigate('/dashboard')} className="group bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-emerald-500/20 dark:border-emerald-500/20 rounded-xl p-6 transition-all hover:shadow-xl hover:border-primary/40 flex flex-col items-center text-center cursor-pointer">
                            <div className="mb-4 relative">
                                <div className="size-20 bg-center bg-no-repeat bg-cover rounded-full border-4 border-slate-100 dark:border-slate-700 shadow-inner" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB4MqHaqID2o3FQCmhyBg7MkOdVefdBkFPyfhdGlqBeTYd4gPn_4n_6llSLUfL_xwwGuFu00x2OlQwzFIArSaWJVBLAMn_UianqAbkxTMduoRYI_Y2gHCCM26cp2_mPomQHYxmV6C9YN17mZ7ZY1mzJL9uDXjWDXx9QrarJgJfdUcy0GaFXgSUCwm0Nk3nBzNhbzLaIZ6v_7d1UDMRba1wDd6JEWKSw86XclsCHUYGF6KvWsfvl471JcAmuTboQvPASLpcHxMJgKLsb')" }}></div>
                                <div className="absolute bottom-0 right-0 size-6 bg-green-500 rounded-full border-4 border-white dark:border-[#1e293b]"></div>
                            </div>
                            <h3 className="text-slate-900 dark:text-white text-lg font-black mb-1 group-hover:text-primary transition-colors">Cloud Commanders</h3>
                            <div className="flex flex-col gap-2 mt-2 w-full">
                                <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-black/70 text-sm font-black">
                                    <span className="material-symbols-outlined text-xs">group</span>
                                    15 Members
                                </div>
                                <div className="inline-flex items-center justify-center px-3 py-1 bg-emerald-100 dark:bg-white text-emerald-800 dark:text-black text-xs font-black rounded-full shadow-sm">
                                    3 Active Hackathons
                                </div>
                            </div>
                        </div>

                        {/* Team Card 6 - Logic Lords */}
                        <div onClick={() => navigate('/dashboard')} className="group bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-emerald-500/20 dark:border-emerald-500/20 rounded-xl p-6 transition-all hover:shadow-xl hover:border-primary/40 flex flex-col items-center text-center cursor-pointer">
                            <div className="mb-4 relative">
                                <div className="size-20 bg-center bg-no-repeat bg-cover rounded-full border-4 border-slate-100 dark:border-slate-700 shadow-inner" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC9gNwYcsaqxVCOnvczQONH-2ymxTRFWfthWg_5FwZhu1jqL15fdPY8dGro-V9-n2XD3pZWVwEg15IKWHDx3SgVhgRoc1IRm_4H99jSfoahnq_cmYigjcjL9OUZC7Nn8n2BY0uDWPFskh5tPAMKkdnieaVspBV2-n-l9A6CYjA_MKAkHKREKaBOHYVmapQwsibyEiJecwCxcpvoMbtVRrT1Rj9k4sEkqVHAO8E0uhvdP5Hm1oyTlitMC_0dydaPY3rD1jlJwVvUSd8w')" }}></div>
                            </div>
                            <h3 className="text-slate-900 dark:text-white text-lg font-black mb-1 group-hover:text-primary transition-colors">Logic Lords</h3>
                            <div className="flex flex-col gap-2 mt-2 w-full">
                                <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-black/70 text-sm font-black">
                                    <span className="material-symbols-outlined text-xs">group</span>
                                    7 Members
                                </div>
                                <div className="inline-flex items-center justify-center px-3 py-1 bg-emerald-100 dark:bg-white text-emerald-800 dark:text-black text-xs font-black rounded-full shadow-sm">
                                    2 Active Hackathons
                                </div>
                            </div>
                        </div>

                        {/* Add Team Placeholder Card */}
                        <div
                            onClick={() => navigate('/teams/select')}
                            className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center group hover:border-primary/50 cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/20"
                        >
                            <div className="size-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-all mb-4">
                                <span className="material-symbols-outlined text-3xl">add</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 font-bold">New Team</p>
                        </div>
                    </div>
                </section>

                {/* Quick Action FAB (Desktop variant) */}
                <div className="fixed bottom-10 right-10">
                    <button className="flex items-center gap-3 px-6 h-16 bg-primary text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer">
                        <span className="material-symbols-outlined">bolt</span>
                        <span className="font-bold text-lg">Quick Join</span>
                    </button>
                </div>
            </main>
        </div>
    );
}
