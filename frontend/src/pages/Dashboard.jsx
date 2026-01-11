import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HackathonCard from '../components/HackathonCard';
import NewHackathonModal from '../components/NewHackathonModal';
import { getHackathons } from '../firebase/functions';

export default function Dashboard() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hackathons, setHackathons] = useState([]);
    const [loadingHackathons, setLoadingHackathons] = useState(true);
    const [copied, setCopied] = useState(false);
    const teamId = "team-alpha-bits-id"; // Hardcoded for now as per previous context
    const joinCode = "XJ9-22L";

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

    const handleCopyCode = () => {
        navigator.clipboard.writeText(joinCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        fetchHackathons();
    }, [fetchHackathons]);

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            {/* Profile Header */}
            <div className="flex flex-col @[520px]:flex-row @[520px]:items-center justify-between gap-6 bg-white dark:bg-slate-900/40 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex gap-5 items-center">
                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl size-20 shadow-lg border-2 border-primary/20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBqKVE-Fbz3DwX1MnQJDpDIqR6p5m0lOIH-zp5X8kkzZgXoTl4c64rAZgNVdEF49u0cXw3QrP2tbgu6yhpsYVi2JTDo8Zn-ntzG6W0-JA9rxNoDAsyjbZZgo_EPnhgppLkpbu6lmE8AF5naq7qR3F_G4E3TjbyryMKlyCH10U52PDC4euYvmZdkJVM4ojFAiQMVbJzs8YM2hH4ArN3JGnTV2MeOT0FYd-Y8MH2tqvhueBgAPCQfHi2aR-cz8monZIWrzZ0a4PJur4wE")' }}></div>
                    <div className="flex flex-col">
                        <h1 className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">Team Alpha-Bits</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">groups</span> Hackathon Workspace
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">Join Code: {joinCode}</span>
                            <button
                                onClick={handleCopyCode}
                                className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                                title="Copy Join Code"
                            >
                                <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
                                {copied && <span className="text-xs font-bold animate-in fade-in">Link copied!</span>}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 @[480px]:flex-none flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        New Hackathon
                    </button>
                </div>
            </div>

            {/* Active Hackathons Section */}
            <div>
                <div className="flex items-center justify-between px-2 mb-4">
                    <h2 className="text-slate-900 dark:text-white text-xl font-bold">Active Hackathons</h2>
                    <button className="text-primary text-sm font-semibold hover:underline">View All</button>
                </div>

                {loadingHackathons ? (
                    <div className="flex items-center justify-center py-20 text-slate-500">
                        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                        Loading hackathons...
                    </div>
                ) : hackathons.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
                        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">event_busy</span>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No hackathons found</p>
                        <button onClick={() => setIsModalOpen(true)} className="text-primary text-sm font-bold hover:underline mt-2">Create one now</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {hackathons.map((hackathon) => (
                            <div key={hackathon.id} onClick={() => navigate('/workspace')} className="cursor-pointer">
                                <HackathonCard
                                    title={hackathon.name}
                                    TimeInfo={`Starts: ${new Date(hackathon.startDate).toLocaleDateString()}`}
                                    status={hackathon.status}
                                    progress={hackathon.status === "Completed" ? 100 : hackathon.status === "Ongoing" ? 50 : 0}
                                    image="https://lh3.googleusercontent.com/aida-public/AB6AXuB9PAOY0tIhO6AfT2CPKIxambugzwRa53Hrf3QnXFSdGFg-NWOtJ7pNhPOM7HGmtq1RrRWkdaNeq2ntVNuINMsfej13ZfcOWQW67K7DADu5iCo_N5tPXJrjK4f8kkbXOT8Fpk2jJDNlujC-3V8AnjV49G6UgkJZUeeB9CHZOeE4gv3h0oMR9UaoRkQX4uh2WI9UPFvHcq3zAY3z-Kv11Z9nfQ4LBTkS-zxMMQXs5iP0ggXcbS35NVRtltCkIYpyDhHt3pGjzgCoZhOQ"
                                    participants={[]} // Placeholder for now, real participants would come from DB
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* New Hackathon Modal */}
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
