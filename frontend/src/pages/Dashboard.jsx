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
    const [copied, setCopied] = useState(false);
    const teamId = "team-alpha-bits-id";

    const handleCopyCode = () => {
        navigator.clipboard.writeText("XJ9-22L");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                <div className="relative z-30 flex flex-col @[520px]:flex-row @[520px]:items-center justify-between gap-6 bg-white/60 dark:bg-black/40 backdrop-blur-2xl p-6 rounded-2xl border border-emerald-500/20 dark:border-emerald-500/20 shadow-xl">
                    <div className="flex gap-5 items-center">
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl size-20 shadow-lg border-2 border-primary/20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBqKVE-Fbz3DwX1MnQJDpDIqR6p5m0lOIH-zp5X8kkzZgXoTl4c64rAZgNVdEF49u0cXw3QrP2tbgu6yhpsYVi2JTDo8Zn-ntzG6W0-JA9rxNoDAsyjbZZgo_EPnhgppLkpbu6lmE8AF5naq7qR3F_G4E3TjbyryMKlyCH10U52PDC4euYvmZdkJVM4ojFAiQMVbJzs8YM2hH4ArN3JGnTV2MeOT0FYd-Y8MH2tqvhueBgAPCQfHi2aR-cz8monZIWrzZ0a4PJur4wE")' }}></div>
                        <div className="flex flex-col gap-2 justify-center">
                            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                                <h1 className="text-slate-900 dark:text-black text-2xl font-black tracking-tight">Team Alpha-Bits</h1>
                                <div className="flex items-center gap-3">
                                    {/* Team Members Dropdown */}
                                    <div className="relative group z-40">
                                        <div className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">4 Members</span>
                                            <div className="flex -space-x-2">
                                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKjUQ66xDalBfRsaC936ij73oYH25Apri9FE6H6BODXUu6yDFtQCLf6dmmT4HPojEzYpJb6DxQRSa87aYM6wXtpd73Y29VWkJiqx2XfUT0oiGB0Y8hlQ1L1FQxYtQeNtcFtZGUfn-3lWBkgn8tesgpeKsvpLxCGUS5YNnELL55p1QZFeSc8C8t5V2MsuYqWbaf78d7yBszxR2Y2V4FulzYB4XgVVGQd747I7GFda_r1YdZZUAj34NUFGTMI7epdBJecOou6ca9pnR_" className="size-6 rounded-full border-2 border-white dark:border-slate-900" />
                                                <img src="https://i.pravatar.cc/150?u=alice" className="size-6 rounded-full border-2 border-white dark:border-slate-900" />
                                                <img src="https://i.pravatar.cc/150?u=bob" className="size-6 rounded-full border-2 border-white dark:border-slate-900" />
                                                <div className="size-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300">+1</div>
                                            </div>
                                        </div>

                                        {/* Dropdown Menu */}
                                        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase px-2 py-1 mb-1">Team Members</h4>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                                                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKjUQ66xDalBfRsaC936ij73oYH25Apri9FE6H6BODXUu6yDFtQCLf6dmmT4HPojEzYpJb6DxQRSa87aYM6wXtpd73Y29VWkJiqx2XfUT0oiGB0Y8hlQ1L1FQxYtQeNtcFtZGUfn-3lWBkgn8tesgpeKsvpLxCGUS5YNnELL55p1QZFeSc8C8t5V2MsuYqWbaf78d7yBszxR2Y2V4FulzYB4XgVVGQd747I7GFda_r1YdZZUAj34NUFGTMI7epdBJecOou6ca9pnR_" className="size-8 rounded-full" />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">You</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">Team Lead</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                                                    <img src="https://i.pravatar.cc/150?u=alice" className="size-8 rounded-full" />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Alice Smith</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">Developer</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                                                    <img src="https://i.pravatar.cc/150?u=bob" className="size-8 rounded-full" />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Bob Jones</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">Designer</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                                                    <img src="https://i.pravatar.cc/150?u=charlie" className="size-8 rounded-full" />
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Charlie Day</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">Developer</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full">{hackathons.length} Projects</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">Join Code: XJ9-22L</span>
                                <button
                                    onClick={handleCopyCode}
                                    className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                                    title="Copy to clipboard"
                                >
                                    {copied ? (
                                        <>
                                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                            <span className="text-[10px] font-bold">Copied!</span>
                                        </>
                                    ) : (
                                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                    )}
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

                    {/* Resume Work Card */}
                    <div className="bg-[#0f172a] rounded-2xl p-8 text-white relative overflow-hidden group flex flex-col items-center text-center">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none"></div>
                        <div className="relative z-10 w-full">
                            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Resume Work</span>
                            </div>

                            <h3 className="text-xl font-bold mb-2">Global AI Hack 2024</h3>
                            <p className="text-slate-400 text-sm mb-8 max-w-[200px] mx-auto">Jump right back into your hackathon project.</p>

                            <button
                                onClick={() => navigate('/workspace')}
                                className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-black text-lg transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] flex items-center justify-center gap-3 group/btn"
                            >
                                <span className="material-symbols-outlined text-2xl group-hover/btn:translate-x-1 transition-transform">play_circle</span>
                                Continue where you left off
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
