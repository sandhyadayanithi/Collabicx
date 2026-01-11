import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HackathonCard from '../components/HackathonCard';
import NewHackathonModal from '../components/NewHackathonModal';
import TaskItem from '../components/TaskItem';
import { getHackathons } from '../firebase/functions';

export default function Dashboard() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hackathons, setHackathons] = useState([]);
    const [loadingHackathons, setLoadingHackathons] = useState(true);
    const [filter, setFilter] = useState('All');
    const teamId = "team-alpha-bits-id";

    const fetchHackathons = useCallback(async () => {
        setLoadingHackathons(true);
        try {
            const data = await getHackathons(teamId);
            setHackathons(data);
        } catch (error) {
            console.error("Failed to fetch hackathons:", error);
        } finally {
            setLoadingHackathons(false);
        }
    }, [teamId]);

    useEffect(() => {
        fetchHackathons();
    }, [fetchHackathons]);

    // Filtering logic
    const filteredHackathons = hackathons.filter(h => {
        if (filter === 'All') return true;
        return h.status === filter;
    });

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
            {/* Top Section: Profile Header & Search */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col @[520px]:flex-row @[520px]:items-center justify-between gap-6 bg-white/60 dark:bg-black/40 backdrop-blur-2xl p-6 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/20 shadow-xl">
                    <div className="flex gap-5 items-center">
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl size-20 shadow-lg border-2 border-primary/20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBqKVE-Fbz3DwX1MnQJDpDIqR6p5m0lOIH-zp5X8kkzZgXoTl4c64rAZgNVdEF49u0cXw3QrP2tbgu6yhpsYVi2JTDo8Zn-ntzG6W0-JA9rxNoDAsyjbZZgo_EPnhgppLkpbu6lmE8AF5naq7qR3F_G4E3TjbyryMKlyCH10U52PDC4euYvmZdkJVM4ojFAiQMVbJzs8YM2hH4ArN3JGnTV2MeOT0FYd-Y8MH2tqvhueBgAPCQfHi2aR-cz8monZIWrzZ0a4PJur4wE")' }}></div>
                        <div className="flex flex-col">
                            <h1 className="text-slate-900 dark:text-black text-2xl font-black tracking-tight flex items-center gap-3">
                                Team Alpha-Bits
                                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full">{hackathons.length} Projects</span>
                            </h1>
                            <p className="text-slate-700 dark:text-black/70 text-sm font-black flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">groups</span> Hackathon Workspace
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">Join Code: XJ9-22L</span>
                                <button className="text-primary hover:text-primary/80 transition-colors">
                                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                            <input
                                type="text"
                                placeholder="Search projects..."
                                className="pl-10 pr-4 h-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary w-64 transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="h-11 px-5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/25 flex items-center gap-2 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            New Hackathon
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6 px-2">
                    {['All', 'Ongoing', 'Upcoming', 'Completed'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${filter === f ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Middle Section: Main Content */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Column: Hackathon Cards & Tasks */}
                <div className="xl:col-span-8 space-y-12">
                    {/* Hackathon Cards Grid */}
                    <div className="space-y-6">
                        {loadingHackathons ? (
                            <div className="flex items-center justify-center py-20 text-slate-500">
                                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                                Loading...
                            </div>
                        ) : filteredHackathons.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50">
                                <span className="material-symbols-outlined text-4xl mb-4">folder_open</span>
                                <p className="font-bold">No hackathons found</p>
                                <p className="text-sm">Try changing filters or create a new one.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredHackathons.map((hackathon) => (
                                    <div key={hackathon.id} onClick={() => navigate('/workspace')} className="cursor-pointer h-full">
                                        <HackathonCard
                                            title={hackathon.name}
                                            TimeInfo={`${new Date(hackathon.startDate).toLocaleDateString()} - ${new Date(hackathon.endDate).toLocaleDateString()}`}
                                            status={hackathon.status}
                                            progress={hackathon.status === "Completed" ? 100 : hackathon.status === "Ongoing" ? 45 : 0}
                                            daysLeft={Math.max(0, Math.ceil((new Date(hackathon.endDate) - new Date()) / (1000 * 60 * 60 * 24)))}
                                            nextDeadline="Submission: Friday"
                                            image="https://lh3.googleusercontent.com/aida-public/AB6AXuB9PAOY0tIhO6AfT2CPKIxambugzwRa53Hrf3QnXFSdGFg-NWOtJ7pNhPOM7HGmtq1RrRWkdaNeq2ntVNuINMsfej13ZfcOWQW67K7DADu5iCo_N5tPXJrjK4f8kkbXOT8Fpk2jJDNlujC-3V8AnjV49G6UgkJZUeeB9CHZOeE4gv3h0oMR9UaoRkQX4uh2WI9UPFvHcq3zAY3z-Kv11Z9nfQ4LBTkS-zxMMQXs5iP0ggXcbS35NVRtltCkIYpyDhHt3pGjzgCoZhOQ"
                                            participants={['https://i.pravatar.cc/150?u=a', 'https://i.pravatar.cc/150?u=b']}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Column: Context Panel */}
                <div className="xl:col-span-4 space-y-6">
                    {/* Upcoming Deadlines Card */}
                    <div className="bg-white/60 dark:bg-black/40 backdrop-blur-2xl rounded-2xl border border-emerald-500/20 dark:border-emerald-500/20 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-900 dark:text-black flex items-center gap-2">
                                <span className="material-symbols-outlined text-orange-500">warning</span>
                                Upcoming Deadlines
                            </h3>
                            <button className="text-xs font-bold text-primary hover:underline">View Calendar</button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-4 items-start p-3 rounded-xl bg-orange-50 dark:bg-orange-500/20 border border-orange-100 dark:border-orange-500/30">
                                <div className="bg-white dark:bg-slate-900 rounded-lg p-2 text-center min-w-[50px] shadow-sm border border-slate-100 dark:border-slate-800">
                                    <span className="block text-xs font-bold text-orange-500 uppercase">Jan</span>
                                    <span className="block text-xl font-black text-slate-900 dark:text-white">24</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-slate-900 dark:text-black text-sm">Global AI Submission</p>
                                    <p className="text-xs text-slate-500 dark:text-black/50 font-medium">11:59 PM EST</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-[10px] font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">High Priority</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-2 text-center min-w-[50px]">
                                    <span className="block text-xs font-bold text-slate-500 uppercase">Feb</span>
                                    <span className="block text-xl font-black text-slate-900 dark:text-white">02</span>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-black text-sm">Design Freeze</p>
                                    <p className="text-xs text-slate-500 dark:text-black/50 font-medium">5:00 PM PST</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Timer Card */}
                    <div className="bg-[#0f172a] rounded-2xl p-6 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4 text-slate-300 text-xs font-bold uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Live Now
                            </div>
                            <h3 className="text-xl font-bold mb-1">Global AI Hack 2024</h3>
                            <p className="text-slate-400 text-sm mb-6">Coding Phase ends in...</p>

                            <div className="grid grid-cols-4 gap-2 mb-6">
                                <div className="bg-slate-800/50 rounded-lg p-2 text-center backdrop-blur-sm border border-slate-700">
                                    <span className="block text-lg font-black font-mono">02</span>
                                    <span className="text-[10px] text-slate-500 font-medium uppercase">Days</span>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-2 text-center backdrop-blur-sm border border-slate-700">
                                    <span className="block text-lg font-black font-mono">14</span>
                                    <span className="text-[10px] text-slate-500 font-medium uppercase">Hrs</span>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-2 text-center backdrop-blur-sm border border-slate-700">
                                    <span className="block text-lg font-black font-mono">32</span>
                                    <span className="text-[10px] text-slate-500 font-medium uppercase">Min</span>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-2 text-center backdrop-blur-sm border border-slate-700">
                                    <span className="block text-lg font-black font-mono text-primary">45</span>
                                    <span className="text-[10px] text-slate-500 font-medium uppercase">Sec</span>
                                </div>
                            </div>

                            <button onClick={() => navigate('/workspace')} className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors shadow-lg shadow-white/10">
                                Enter Workspace
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <NewHackathonModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchHackathons();
                }}
                teamId={teamId}
            />
        </div>
    );
}
