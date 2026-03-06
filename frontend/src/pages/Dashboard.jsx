import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HackathonCard from '../components/HackathonCard';
import NewHackathonModal from '../components/NewHackathonModal';
import TaskItem from '../components/TaskItem';
import { deleteHackathon, getHackathons, getUserTeams, getTeamMembers } from '../firebase/functions';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import cover1 from '../assets/hackathon-covers/cover1.png';
import cover2 from '../assets/hackathon-covers/cover2.png';
import cover3 from '../assets/hackathon-covers/cover3.png';
import cover4 from '../assets/hackathon-covers/cover4.png';
import cover5 from '../assets/hackathon-covers/cover5.png';
import { getAvatarImage } from '../constants/avatars';

const hackathonImages = [cover1, cover2, cover3, cover4, cover5];

export default function Dashboard() {
    const navigate = useNavigate();
    const { teamId: urlTeamId } = useParams();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hackathons, setHackathons] = useState([]);
    const [loadingHackathons, setLoadingHackathons] = useState(true);
    const [filter, setFilter] = useState('All');
    const [copied, setCopied] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingHackathon, setEditingHackathon] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Real user data states
    const [currentUser, setCurrentUser] = useState(null);
    const [userTeams, setUserTeams] = useState([]);
    const [currentTeam, setCurrentTeam] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loadingTeams, setLoadingTeams] = useState(true);

    // Fetch user and their teams on mount
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                // Fetch user data
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                const data = userSnap.data();
                if (userSnap.exists() && !(data.profession || data.usageRole || data.username)) {
                    navigate('/profile-setup');
                    return;
                }

                // Fetch user's teams
                setLoadingTeams(true);
                try {
                    const teams = await getUserTeams(user.uid);
                    setUserTeams(teams);

                    if (teams.length === 0) {
                        // No teams, redirect to team selection
                        navigate('/teams/select');
                    } else {
                        // Set team from URL if exists, otherwise first team
                        const selectedTeam = urlTeamId ? teams.find(t => t.id === urlTeamId) : teams[0];
                        setCurrentTeam(selectedTeam || teams[0]);
                    }
                } catch (error) {
                    console.error("Error fetching teams:", error);
                } finally {
                    setLoadingTeams(false);
                }
            } else {
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // Fetch hackathons and team members when current team changes
    useEffect(() => {
        if (currentTeam) {
            fetchHackathons();
            fetchTeamMembers();
        }
    }, [currentTeam]);

    const fetchHackathons = async () => {
        if (!currentTeam) return;

        setLoadingHackathons(true);
        try {
            const data = await getHackathons(currentTeam.id);
            setHackathons(data);
        } catch (error) {
            console.error("Failed to fetch hackathons:", error);
        } finally {
            setLoadingHackathons(false);
        }
    };

    const fetchTeamMembers = async () => {
        if (!currentTeam) return;

        try {
            const members = await getTeamMembers(currentTeam.id);
            setTeamMembers(members);
        } catch (error) {
            console.error("Failed to fetch team members:", error);
        }
    };

    const handleCopyCode = () => {
        if (currentTeam?.joinCode) {
            navigator.clipboard.writeText(currentTeam.joinCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDeleteHackathon = (hackathon) => {
        if (!currentTeam?.id || !hackathon?.id) return;
        setDeleteTarget(hackathon);
    };

    const confirmDeleteHackathon = async () => {
        if (!currentTeam?.id || !deleteTarget?.id) return;
        try {
            await deleteHackathon(currentTeam.id, deleteTarget.id);
            setHackathons(prev => prev.filter(h => h.id !== deleteTarget.id));
        } catch (error) {
            console.error("Failed to delete hackathon:", error);
        } finally {
            setDeleteTarget(null);
        }
    };

    // Filtering logic
    const filteredHackathons = hackathons.filter(h => {
        if (filter === 'All') return true;
        if (filter === 'Ongoing') return h.status === 'Ongoing' || h.status === 'Registered';
        if (filter === 'Upcoming') return h.status === 'Upcoming' || h.status === 'Yet to register';
        return h.status === filter;
    });

    // Calculate deadlines from hackathons
    const upcomingDeadlines = hackathons
        .filter(h => h.status !== 'Completed' && new Date(h.endDate) > new Date())
        .map(h => {
            const date = new Date(h.endDate);
            return {
                id: h.id,
                title: `${h.name} Submission`,
                date: date,
                month: date.toLocaleString('default', { month: 'short' }),
                day: date.getDate(),
                time: "11:59 PM" // Default time since we only have date
            };
        })
        .sort((a, b) => a.date - b.date);

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
            {/* Top Section: Profile Header & Search */}
            <div className="flex flex-col gap-6">
                <div className="relative z-30 flex flex-col @[520px]:flex-row @[520px]:items-center justify-between gap-6 vibrant-card p-6 rounded-2xl border border-slate-300 dark:border-white/10 shadow-xl">
                    <div className="flex gap-5 items-center">
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl size-20 shadow-lg border-2 border-primary/20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBqKVE-Fbz3DwX1MnQJDpDIqR6p5m0lOIH-zp5X8kkzZgXoTl4c64rAZgNVdEF49u0cXw3QrP2tbgu6yhpsYVi2JTDo8Zn-ntzG6W0-JA9rxNoDAsyjbZZgo_EPnhgppLkpbu6lmE8AF5naq7qR3F_G4E3TjbyryMKlyCH10U52PDC4euYvmZdkJVM4ojFAiQMVbJzs8YM2hH4ArN3JGnTV2MeOT0FYd-Y8MH2tqvhueBgAPCQfHi2aR-cz8monZIWrzZ0a4PJur4wE")' }}></div>
                        <div className="flex flex-col gap-2 justify-center">
                            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                                <h1 className="text-vibrant-primary text-2xl font-black tracking-tight">{currentTeam?.name || 'Loading...'}</h1>
                                <div className="flex items-center gap-3">
                                    {/* Team Members Dropdown */}
                                    <div className="relative group z-40">
                                        <div className="flex items-center gap-2 cursor-pointer vibrant-badge px-3 py-1.5 rounded-full transition-colors">
                                            <span className="text-xs font-black">{teamMembers.length} {teamMembers.length === 1 ? 'Member' : 'Members'}</span>
                                            <div className="flex -space-x-2">
                                                {teamMembers.slice(0, 3).map((member, idx) => (
                                                    <img key={idx} src={getAvatarImage(member.user?.avatar)} className="size-6 rounded-full border-2 border-white dark:border-slate-900" />
                                                ))}
                                                {teamMembers.length > 3 && (
                                                    <div className="size-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300">+{teamMembers.length - 3}</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Dropdown Menu */}
                                        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                            <h4 className="text-xs font-bold text-slate-500 dark:text-white uppercase px-2 py-1 mb-1">Team Members</h4>
                                            <div className="space-y-1">
                                                {teamMembers.length > 0 ? teamMembers.map((member) => (
                                                    <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                                                        <img src={getAvatarImage(member.user?.avatar)} className="size-8 rounded-full" />
                                                        <div>
                                                            <p className="text-sm font-bold text-vibrant-primary">{member.user?.name || 'Unknown'}</p>
                                                            <p className="text-[10px] text-vibrant-secondary font-black">{member.role === 'owner' ? 'Team Lead' : 'Member'}</p>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <p className="text-sm text-slate-500 dark:text-white px-2 py-4 text-center">No members yet</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black vibrant-badge px-3 py-1 rounded-full">{hackathons.length} Projects</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono vibrant-badge px-2 py-0.5 rounded">Join Code: {currentTeam?.joinCode || 'N/A'}</span>
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
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-vibrant-secondary text-[20px]">search</span>
                            <input
                                type="text"
                                placeholder="Search projects..."
                                className="pl-10 pr-4 h-11 vibrant-badge rounded-xl text-sm font-black focus:ring-2 focus:ring-primary/20 focus:border-primary w-64 transition-all placeholder:text-slate-400"
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
                            className={`pb-3 text-sm font-black border-b-2 transition-colors ${filter === f ? 'border-primary text-primary' : 'border-transparent text-vibrant-secondary hover:text-black dark:hover:text-white'}`}
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
                            <div className="flex items-center justify-center py-20 text-slate-500 dark:text-white">
                                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                                Loading...
                            </div>
                        ) : filteredHackathons.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-vibrant-secondary border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl vibrant-card">
                                <span className="material-symbols-outlined text-4xl mb-4">folder_open</span>
                                <p className="font-bold">No hackathons found</p>
                                <p className="text-sm">Try changing filters or create a new one.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredHackathons.map((hackathon, index) => (
                                    <HackathonCard
                                        key={hackathon.id}
                                        id={hackathon.id}
                                        teamId={currentTeam?.id}
                                        title={hackathon.name}
                                        TimeInfo={`${new Date(hackathon.startDate).toLocaleDateString()} - ${new Date(hackathon.endDate).toLocaleDateString()}`}
                                        status={hackathon.status}
                                        progress={hackathon.status === "Completed" ? 100 : hackathon.status === "Ongoing" ? 45 : 0}
                                        daysLeft={Math.max(0, Math.ceil((new Date(hackathon.endDate) - new Date()) / (1000 * 60 * 60 * 24)))}
                                        nextDeadline={`Submission: ${new Date(hackathon.endDate).toLocaleDateString('en-US', { weekday: 'long' })}`}
                                        image={hackathonImages[index % hackathonImages.length]}
                                        participants={['https://i.pravatar.cc/150?u=a', 'https://i.pravatar.cc/150?u=b']}
                                        onEdit={() => {
                                            setEditingHackathon(hackathon);
                                            setIsEditModalOpen(true);
                                        }}
                                        onDelete={() => handleDeleteHackathon(hackathon)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Column: Context Panel */}
                <div className="xl:col-span-4 space-y-6">
                    {/* Upcoming Deadlines Card */}
                    <div className="vibrant-card rounded-2xl border border-slate-300 dark:border-white/10 p-6 shadow-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-vibrant-primary flex items-center gap-2">
                                <span className="material-symbols-outlined text-orange-500">warning</span>
                                Upcoming Deadlines
                            </h3>
                            <button className="text-xs font-bold text-primary hover:underline">View Calendar</button>
                        </div>
                        <div className="space-y-4">
                            {upcomingDeadlines.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <span className="material-symbols-outlined text-3xl mb-2 opacity-20">event_busy</span>
                                    <p className="text-xs font-medium">No upcoming deadlines</p>
                                </div>
                            ) : upcomingDeadlines.map((deadline, index) => (
                                <div
                                    key={deadline.id}
                                    className={`flex gap-4 items-start p-3 rounded-xl transition-all ${index === 0
                                        ? 'bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20'
                                        : 'hover:vibrant-badge cursor-pointer border border-transparent'
                                        }`}
                                >
                                    <div className={`vibrant-badge rounded-lg p-2 text-center min-w-[50px] ${index === 0 ? 'border-orange-500/50' : ''}`}>
                                        <span className={`block text-xs font-black uppercase ${index === 0 ? 'text-orange-500' : 'text-vibrant-secondary'}`}>
                                            {deadline.month}
                                        </span>
                                        <span className="block text-xl font-black text-black dark:text-white">
                                            {deadline.day}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-vibrant-primary text-sm truncate">{deadline.title}</p>
                                        <p className="text-xs text-vibrant-secondary font-bold">{deadline.time}</p>
                                        {index === 0 && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-[10px] font-bold vibrant-badge px-2 py-0.5 rounded flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px] text-orange-500">warning</span>
                                                    High Priority
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resume Work Card */}
                    <div className="vibrant-card rounded-2xl p-8 relative overflow-hidden group flex flex-col items-center text-center shadow-xl border border-slate-300 dark:border-white/10">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none"></div>
                        <div className="relative z-10 w-full">
                            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full vibrant-subtle-badge">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-emerald-500 text-xs font-black uppercase tracking-wider">Resume Work</span>
                            </div>

                            {(() => {
                                const lastViewed = JSON.parse(localStorage.getItem('lastViewedHackathon') || 'null');
                                const resumable = (lastViewed && currentTeam && lastViewed.teamId === currentTeam.id)
                                    ? hackathons.find(h => h.id === lastViewed.hackathonId) || hackathons[0]
                                    : hackathons[0];

                                return (
                                    <>
                                        <h3 className="text-xl font-black mb-2 text-vibrant-primary">{resumable?.name || "No Active Hackathon"}</h3>
                                        <p className="text-vibrant-secondary text-sm mb-8 max-w-[200px] mx-auto font-black">
                                            {resumable ? "Jump right back into your hackathon project." : "You haven't joined any hackathons yet."}
                                        </p>

                                        <button
                                            onClick={() => resumable && currentTeam?.id && navigate(`/workspace/${currentTeam.id}/${resumable.id}`)}
                                            disabled={!resumable}
                                            className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-black text-lg transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] flex items-center justify-center gap-3 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="material-symbols-outlined text-2xl group-hover/btn:translate-x-1 transition-transform">play_circle</span>
                                            {resumable ? "Continue where you left off" : "Create a Hackathon first"}
                                        </button>
                                    </>
                                );
                            })()}
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
                teamId={currentTeam?.id}
            />

            <NewHackathonModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingHackathon(null);
                }}
                onSuccess={() => {
                    setIsEditModalOpen(false);
                    setEditingHackathon(null);
                    fetchHackathons();
                }}
                teamId={currentTeam?.id}
                isEdit={true}
                hackathonId={editingHackathon?.id}
                initialData={editingHackathon}
            />

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-black text-vibrant-primary">Delete Hackathon?</h3>
                            <p className="text-sm text-slate-500 font-bold mt-2">
                                This will remove <span className="text-vibrant-primary">{deleteTarget.name}</span> and all its data.
                            </p>
                        </div>
                        <div className="p-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteHackathon}
                                className="flex-1 py-2.5 bg-red-500 text-white text-sm font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
