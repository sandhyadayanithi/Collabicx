import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function TeamsDashboard() {
    const navigate = useNavigate();

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen flex">
            {/* Sidebar Navigation */}
            <Sidebar showLogo={true}>
                <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 border-l-[3px] border-primary text-primary transition-colors" href="#">
                    <span className="material-symbols-outlined">groups</span>
                    <p className="text-sm font-semibold">My Teams</p>
                </a>
                <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-[#9da6b9] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" href="#">
                    <span className="material-symbols-outlined">explore</span>
                    <p className="text-sm font-medium">Discover</p>
                </a>
                <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-[#9da6b9] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" href="#">
                    <span className="material-symbols-outlined">settings</span>
                    <p className="text-sm font-medium">Account Settings</p>
                </a>
            </Sidebar>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col">
                {/* Header Section */}
                <Header title="All Teams Dashboard" hideSearch={true}>
                    <button
                        onClick={() => navigate('/teams/select')}
                        className="flex items-center gap-2 px-5 h-11 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold transition-all shadow-lg shadow-primary/20"
                    >
                        <span className="material-symbols-outlined">add</span>
                        <span>Create New Team</span>
                    </button>
                </Header>

                {/* Team Grid Section */}
                <section className="max-w-[1200px] w-full mx-auto px-8 py-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Team Card 1 */}
                        <div
                            onClick={() => navigate('/')}
                            className="group bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 transition-all hover:shadow-xl hover:border-primary/40 flex flex-col items-center text-center cursor-pointer"
                        >
                            <div className="mb-4 relative">
                                <div className="size-20 bg-center bg-no-repeat bg-cover rounded-full border-4 border-slate-100 dark:border-slate-700 shadow-inner" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCCZQZxQTQTRXuH1zmS6KDScCTzc3ll_tHSdd4DYorf2J9b4SbW_9gc6dyubeJAB395fVuECjaNp1vBoKw_BBNfAL65dn-BVTVBlv2edGRZZ8ynHAKXzzZjmx1ggSEUDby2Tkxe1mSbuyb4HBQwzL0uyK7F6dp-eBFHNJv7S1WBWaqw1dr8NdoAvF_C8M3RDXCbug724ZwXBJ5ameE_gbrYWbNfj5T-xxiT7sAlCdP5FyQJ4JHM7pz4cYN3gzVK8YGloDqOOX38azpB')" }}></div>
                                <div className="absolute bottom-0 right-0 size-6 bg-green-500 rounded-full border-4 border-white dark:border-[#1e293b]"></div>
                            </div>
                            <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-1 group-hover:text-primary transition-colors">Code Wizards</h3>
                            <div className="flex flex-col gap-2 mt-2 w-full">
                                <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                    <span className="material-symbols-outlined text-xs">group</span>
                                    8 Members
                                </div>
                                <div className="inline-flex items-center justify-center px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                    2 Active Hackathons
                                </div>
                            </div>
                        </div>

                        {/* Team Card 2 */}
                        <div
                            onClick={() => navigate('/')}
                            className="group bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 transition-all hover:shadow-xl hover:border-primary/40 flex flex-col items-center text-center cursor-pointer"
                        >
                            <div className="mb-4 relative">
                                <div className="size-20 bg-center bg-no-repeat bg-cover rounded-full border-4 border-slate-100 dark:border-slate-700 shadow-inner" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBSvwOEJnkgqJCXmJ2T7bYu3370DNJyJIBHUaiOQzQ3FoiWhUcXSNI4Gq_fJEP_71emU-2dX9w79CyLdq2TCQxTlOZx2R_foKJZO58-g-NdsZOoLB57w6Gd4Dn7Bbz_lyl92oefa7Fth9qXDhxP_nUSxeh1vTI4q65zvblYMVYGqdjeywt3M6XKhBJWS0hAECThAnjywLRfAqLEJdLEK_QOU8jgLOFIJZg-NNHg99SRZWoYgWtoiQoudse-wqGf_wKOiehVwmCWjdvN')" }}></div>
                            </div>
                            <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-1 group-hover:text-primary transition-colors">Byte Busters</h3>
                            <div className="flex flex-col gap-2 mt-2 w-full">
                                <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                    <span className="material-symbols-outlined text-xs">group</span>
                                    12 Members
                                </div>
                                <div className="inline-flex items-center justify-center px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                    1 Active Hackathon
                                </div>
                            </div>
                        </div>

                        {/* Team Card 3 */}
                        <div
                            onClick={() => navigate('/')}
                            className="group bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl p-6 transition-all hover:shadow-xl hover:border-primary/40 flex flex-col items-center text-center cursor-pointer"
                        >
                            <div className="mb-4 relative">
                                <div className="size-20 bg-center bg-no-repeat bg-cover rounded-full border-4 border-slate-100 dark:border-slate-700 shadow-inner" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDPbFEpuQFcqyIx7eElCeooIiGHBK53crocg_4zoZ_uSIGoFlSL4cCfcuojPJcSD-q4-lQW2wnW55R3zefKcNoulygG8AStwxUPUkEK5ijjyvjff695pro_CqeavQ-7kkaKxeh3h7rwjjbhGgPoBQN7TQ2wsOrY6GodRjQlC6JkjYIXBHWlGg3EpHSjAim4LCAJzWPNX6Y1uHgBiivOo59XX4DRttutvyvgFzqoCiXjsmdTkXmaqsy3_gYOusWybpbGTeFTof9hSniQ')" }}></div>
                                <div className="absolute bottom-0 right-0 size-6 bg-green-500 rounded-full border-4 border-white dark:border-[#1e293b]"></div>
                            </div>
                            <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-1 group-hover:text-primary transition-colors">Neural Knights</h3>
                            <div className="flex flex-col gap-2 mt-2 w-full">
                                <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                    <span className="material-symbols-outlined text-xs">group</span>
                                    5 Members
                                </div>
                                <div className="inline-flex items-center justify-center px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                    4 Active Hackathons
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
                    <button className="flex items-center gap-3 px-6 h-16 bg-primary text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all">
                        <span className="material-symbols-outlined">bolt</span>
                        <span className="font-bold text-lg">Quick Join</span>
                    </button>
                </div>
            </main>
        </div>
    );
}
