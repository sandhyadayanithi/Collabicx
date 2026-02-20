import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
    logout,
    getUserTeams,
    deleteTeam,
    createTeamOpening,
    listenToTeamOpeningsByLead,
    listenToApplicationsByOpeningIds,
    reviewTeamApplication,
    updateTeamOpeningStatus,
    leaveTeam
} from '../firebase/functions';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useTheme } from '../context/ThemeContext';
import ActivityPanel from '../components/ActivityPanel';

export default function TeamsDashboard() {
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const [userData, setUserData] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [userTeams, setUserTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('teams');
    const [leadOpenings, setLeadOpenings] = useState([]);
    const [applications, setApplications] = useState([]);
    const [applicantCache, setApplicantCache] = useState({});
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const prevPendingCount = useRef(0);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
    const [openingForm, setOpeningForm] = useState({
        teamId: '',
        description: '',
        requiredRoles: [],
        collegeScopeType: 'ALL',
        collegeName: '',
        slotsOpen: 1
    });
    const leadTeams = userTeams.filter(team => team.role === 'owner');


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    setCurrentUserId(user.uid);
                    const userRef = doc(db, "users", user.uid);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        setUserData(userSnap.data());
                    }

                    // Fetch user's teams
                    const teams = await getUserTeams(user.uid);
                    setUserTeams(teams);
                } catch (error) {
                    console.error("Initialization error:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (!currentUserId) return;
        const unsubscribe = listenToTeamOpeningsByLead(currentUserId, (data) => {
            setLeadOpenings(data);
        });
        return () => unsubscribe();
    }, [currentUserId]);

    useEffect(() => {
        if (!openingForm.teamId && leadTeams.length > 0) {
            setOpeningForm(prev => ({ ...prev, teamId: leadTeams[0].id }));
        }
    }, [leadTeams, openingForm.teamId]);

    useEffect(() => {
        const openingIds = leadOpenings.map(o => o.id);
        if (openingIds.length === 0) {
            setApplications([]);
            return;
        }

        const unsubscribe = listenToApplicationsByOpeningIds(openingIds, (apps) => {
            setApplications(apps);
            const pending = apps.filter(app => app.status === 'PENDING').length;
            if (prevPendingCount.current && pending > prevPendingCount.current) {
                pushToast('New application received.', 'success');
            }
            prevPendingCount.current = pending;

            apps.forEach(app => fetchApplicant(app.applicantId));
        }, (error) => {
            console.error("Applications listener error:", error);
            // pushToast("Error loading applications.", "error");
        });

        return () => unsubscribe();
    }, [leadOpenings]);

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const pushToast = (message, type = 'success') => {
        setToast({ message, type });
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 3000);
    };

    const fetchApplicant = async (userId) => {
        if (!userId || applicantCache[userId]) return;
        const snap = await getDoc(doc(db, "users", userId));
        if (snap.exists()) {
            setApplicantCache(prev => ({ ...prev, [userId]: snap.data() }));
        }
    };

    const openOpeningModal = () => {
        if (leadTeams.length === 0) {
            pushToast('You need to be a team lead to create openings.', 'error');
            return;
        }
        setOpeningForm(prev => ({
            ...prev,
            teamId: prev.teamId || leadTeams[0].id
        }));
        setIsOpeningModalOpen(true);
    };

    const handleCreateOpening = async (e) => {
        e.preventDefault();
        if (!openingForm.teamId || !currentUserId) return;

        try {
            await createTeamOpening(openingForm.teamId, currentUserId, {
                description: openingForm.description,
                requiredRoles: openingForm.requiredRoles,
                collegeScope: openingForm.collegeScopeType === 'ALL'
                    ? { type: 'ALL' }
                    : { type: 'COLLEGE_ONLY', collegeName: openingForm.collegeName },
                slotsOpen: Number(openingForm.slotsOpen || 1),
                status: 'OPEN'
            });
            pushToast('Team opening created.', 'success');
            setIsOpeningModalOpen(false);
            setOpeningForm({
                teamId: openingForm.teamId,
                description: '',
                requiredRoles: [],
                collegeScopeType: 'ALL',
                collegeName: '',
                slotsOpen: 1
            });
        } catch (error) {
            pushToast(error.message || 'Failed to create opening.', 'error');
        }
    };

    const toggleOpeningStatus = async (opening) => {
        const nextStatus = opening.status === 'OPEN' ? 'CLOSED' : 'OPEN';
        try {
            await updateTeamOpeningStatus(opening.id, nextStatus);
            pushToast(`Opening ${nextStatus.toLowerCase()}.`, 'success');
        } catch (error) {
            pushToast(error.message || 'Failed to update opening.', 'error');
        }
    };

    const handleReview = async (applicationId, decision) => {
        try {
            await reviewTeamApplication({
                applicationId,
                reviewerId: currentUserId,
                decision
            });
            pushToast(decision === 'APPROVE' ? 'Applicant approved.' : 'Applicant rejected.', 'success');
        } catch (error) {
            pushToast(error.message || 'Failed to review application.', 'error');
        }
    };

    const handleDeleteTeam = async (team) => {
        if (!team?.id || !currentUserId) return;
        setDeleteTarget(team);
    };

    const handleLeaveTeam = async (team) => {
        if (!window.confirm(`Are you sure you want to leave ${team.name}?`)) return;
        try {
            await leaveTeam(team.id, currentUserId);
            setUserTeams(prev => prev.filter(t => t.id !== team.id));
            pushToast('Successfully left the team.', 'success');
        } catch (error) {
            pushToast(error.message || 'Failed to leave team.', 'error');
        }
    };

    const confirmDeleteTeam = async () => {
        if (!deleteTarget?.id || !currentUserId) return;
        try {
            await deleteTeam(deleteTarget.id, currentUserId);
            setUserTeams(prev => prev.filter(t => t.id !== deleteTarget.id));
            pushToast('Team deleted.', 'success');
        } catch (error) {
            pushToast(error.message || 'Failed to delete team.', 'error');
        } finally {
            setDeleteTarget(null);
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
                            className="flex items-center gap-3 px-3 py-2 text-black dark:text-emerald-300/80 hover:text-primary dark:hover:text-emerald-400 transition-colors cursor-pointer"
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
                <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-black dark:text-emerald-300/80 hover:bg-slate-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer" onClick={() => navigate('/discover')}>
                    <span className="material-symbols-outlined dark:text-emerald-300/80">explore</span>
                    <p className="text-sm font-black">Discover</p>
                </a>
            </Sidebar>

            {/* Middle & Right Section Wrapper */}
            <div className="flex-1 flex overflow-hidden">
                {/* Main Content Area (Teams List) */}
                <main className="flex-1 flex flex-col bg-background-light dark:bg-background-dark overflow-y-auto custom-scrollbar">
                    {/* Header Section */}
                    <header className="max-w-[1200px] w-full mx-auto px-8 pt-10 pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-vibrant-primary text-4xl font-black tracking-tight">All Teams Dashboard</h2>
                                <p className="text-vibrant-secondary font-black">Manage and organize your collaborative hackathon projects.</p>
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
                                    className="size-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-black dark:text-slate-400 hover:text-primary transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {isDarkMode ? 'light_mode' : 'dark_mode'}
                                    </span>
                                </button>
                            </div>
                        </div>
                        {/* Search/Filter Bar */}
                        <div className="mt-6 flex gap-4 border-b border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setActiveTab('teams')}
                                className={`pb-3 text-sm font-black border-b-2 transition-colors ${activeTab === 'teams'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-vibrant-secondary hover:text-black dark:hover:text-white'
                                    }`}
                            >
                                My Teams
                            </button>
                            <button
                                onClick={() => setActiveTab('openings')}
                                className={`pb-3 text-sm font-black border-b-2 transition-colors ${activeTab === 'openings'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-vibrant-secondary hover:text-black dark:hover:text-white'
                                    }`}
                            >
                                Team Openings
                            </button>
                        </div>
                        {activeTab === 'teams' && (
                            <div className="mt-8">
                                <label className="relative block w-full max-w-md">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-600">
                                        <span className="material-symbols-outlined">search</span>
                                    </span>
                                    <input className="block w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl py-3 pl-11 pr-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm placeholder:text-slate-500 text-vibrant-primary font-black" name="search" placeholder="Search teams by name or project..." type="text" />
                                </label>
                            </div>
                        )}
                    </header>

                    {/* Team Grid / Openings Section */}
                    {activeTab === 'teams' ? (
                        <section className="max-w-[1200px] w-full mx-auto px-8 py-6">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                                </div>
                            ) : userTeams.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <span className="material-symbols-outlined text-6xl text-slate-500 dark:text-slate-700 mb-4">groups</span>
                                    <h3 className="text-xl font-bold text-black dark:text-white mb-2">No Teams Yet</h3>
                                    <p className="text-slate-700 dark:text-slate-400 mb-6 font-black">Create your first team to start collaborating!</p>
                                    <button
                                        onClick={() => navigate('/teams/select')}
                                        className="flex items-center gap-2 px-6 h-12 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold transition-all shadow-lg shadow-primary/20"
                                    >
                                        <span className="material-symbols-outlined">add</span>
                                        <span>Create Team</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {userTeams.map((team) => (
                                        <div
                                            key={team.id}
                                            onClick={() => navigate(`/dashboard/${team.id}`)}
                                            className="group relative vibrant-card border border-slate-300 dark:border-white/10 rounded-xl p-6 transition-all shadow-md hover:shadow-xl hover:border-primary/40 flex flex-col items-center text-center cursor-pointer"
                                        >
                                            {(team.role === 'owner' || team.createdBy === currentUserId) ? (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteTeam(team);
                                                    }}
                                                    className="absolute top-3 right-3 z-20 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity bg-white/95 dark:bg-slate-900/95 border border-red-200 dark:border-red-900 text-red-500 hover:text-red-600 hover:border-red-300 dark:hover:border-red-800 rounded-lg size-8 flex items-center justify-center shadow-sm"
                                                    title="Delete team (Leads)"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleLeaveTeam(team);
                                                    }}
                                                    className="absolute top-3 right-3 z-20 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-red-500 hover:border-red-300 rounded-lg size-8 flex items-center justify-center shadow-sm"
                                                    title="Leave team"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                                </button>
                                            )}
                                            <div className="mb-4 relative">
                                                <div className="size-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full border-4 border-slate-100 dark:border-slate-700 shadow-inner flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-4xl text-primary">groups</span>
                                                </div>
                                                <div className="absolute bottom-0 right-0 size-6 bg-green-500 rounded-full border-4 border-white dark:border-[#1e293b]"></div>
                                            </div>
                                            <h3 className="text-vibrant-primary text-lg font-black mb-1 group-hover:text-primary transition-colors">
                                                {team.name}
                                            </h3>
                                            {team.description && (
                                                <p className="text-slate-700 dark:text-slate-300 text-xs mb-3 line-clamp-2 font-black">{team.description}</p>
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
                    ) : (
                        <section className="max-w-[1200px] w-full mx-auto px-8 py-6 space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-vibrant-primary">Team Openings</h3>
                                    <p className="text-vibrant-secondary font-black text-sm">Post openings and review applications.</p>
                                </div>
                                <button
                                    onClick={openOpeningModal}
                                    className="flex items-center gap-2 px-5 h-11 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold transition-all shadow-lg shadow-primary/20 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                    <span>Create Opening</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {leadOpenings.length === 0 ? (
                                    <div className="vibrant-card rounded-2xl p-8 border border-dashed border-slate-300 dark:border-slate-800 text-center">
                                        <span className="material-symbols-outlined text-4xl text-slate-400 mb-3">event_available</span>
                                        <p className="text-sm font-black text-vibrant-primary">No openings posted yet.</p>
                                        <p className="text-xs font-black text-vibrant-secondary">Create one to start recruiting.</p>
                                    </div>
                                ) : leadOpenings.map(opening => (
                                    <div key={opening.id} className="vibrant-card rounded-2xl p-6 border border-slate-300 dark:border-white/10 shadow-md flex flex-col gap-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-black text-vibrant-primary">{opening.teamName}</p>
                                                <p className="text-xs font-bold text-slate-500">{opening.description || 'No description'}</p>
                                            </div>
                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${opening.status === 'OPEN'
                                                ? 'bg-emerald-500/10 text-emerald-500'
                                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                                }`}>
                                                {opening.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(opening.requiredRoles || []).map(role => (
                                                <span key={role} className="px-2 py-1 text-[10px] font-black rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-black text-slate-500">
                                            <span>Slots open</span>
                                            <span className="text-primary">{opening.slotsOpen}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                                {opening.collegeScope?.type === 'ALL' ? 'All Colleges' : opening.collegeScope?.collegeName}
                                            </span>
                                            <button
                                                onClick={() => toggleOpeningStatus(opening)}
                                                className="text-xs font-black text-primary hover:underline"
                                            >
                                                {opening.status === 'OPEN' ? 'Close' : 'Reopen'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="vibrant-card rounded-2xl p-6 border border-slate-300 dark:border-white/10 shadow-md">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-black text-vibrant-primary">Applications</h3>
                                </div>
                                {applications.length === 0 ? (
                                    <p className="text-sm text-slate-500 font-bold">No applications yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {applications.map(app => {
                                            const applicant = applicantCache[app.applicantId];
                                            return (
                                                <div key={app.id} className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                                    <div className="flex items-center gap-3 min-w-[220px]">
                                                        <div
                                                            className="size-10 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-800"
                                                            style={{ backgroundImage: `url(${applicant?.avatar || 'https://i.pravatar.cc/150'})` }}
                                                        ></div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-black text-vibrant-primary">{applicant?.name || 'Applicant'}</p>
                                                                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded font-black uppercase">
                                                                    {app.teamName}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] font-bold text-slate-500">{app.status} • {app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString() : 'Just now'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-[200px]">
                                                        <p className="text-xs font-bold text-slate-500 line-clamp-2">{app.message || 'No message provided.'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <a
                                                            href={app.githubUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs font-black text-primary hover:underline"
                                                        >
                                                            GitHub
                                                        </a>
                                                        {app.status === 'PENDING' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleReview(app.id, 'APPROVE')}
                                                                    className="px-3 py-2 text-xs font-black rounded-lg bg-emerald-500/10 text-emerald-600"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReview(app.id, 'REJECT')}
                                                                    className="px-3 py-2 text-xs font-black rounded-lg bg-red-500/10 text-red-500"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </main>

                {/* Right Panel: Recent Activity */}
                <ActivityPanel teamIds={userTeams.map(t => t.id)} />
            </div>

            {isOpeningModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create Team Opening</h3>
                                <p className="text-xs text-slate-500 font-bold">Define roles, slots, and eligibility.</p>
                            </div>
                            <button onClick={() => setIsOpeningModalOpen(false)} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateOpening} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Team</label>
                                <select
                                    value={openingForm.teamId}
                                    onChange={(e) => setOpeningForm(prev => ({ ...prev, teamId: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 dark:text-white"
                                >
                                    {leadTeams.map(team => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
                                <textarea
                                    rows="3"
                                    value={openingForm.description}
                                    onChange={(e) => setOpeningForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 dark:text-white resize-none"
                                    placeholder="Short idea or requirement summary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Required Roles</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Frontend', 'Backend', 'AI', 'Design', 'Product', 'Marketing', 'DevOps'].map(role => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setOpeningForm(prev => ({
                                                ...prev,
                                                requiredRoles: prev.requiredRoles.includes(role)
                                                    ? prev.requiredRoles.filter(r => r !== role)
                                                    : [...prev.requiredRoles, role]
                                            }))}
                                            className={`px-3 py-2 text-xs font-black rounded-lg border transition-all ${openingForm.requiredRoles.includes(role)
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-primary/50'
                                                }`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Slots Open</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={openingForm.slotsOpen}
                                        onChange={(e) => setOpeningForm(prev => ({ ...prev, slotsOpen: Number(e.target.value) }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">College Scope</label>
                                    <select
                                        value={openingForm.collegeScopeType}
                                        onChange={(e) => setOpeningForm(prev => ({ ...prev, collegeScopeType: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 dark:text-white"
                                    >
                                        <option value="ALL">All Colleges</option>
                                        <option value="COLLEGE_ONLY">Specific College</option>
                                    </select>
                                </div>
                            </div>
                            {openingForm.collegeScopeType === 'COLLEGE_ONLY' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">College Name</label>
                                    <input
                                        value={openingForm.collegeName}
                                        onChange={(e) => setOpeningForm(prev => ({ ...prev, collegeName: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 dark:text-white"
                                        placeholder="e.g., Stanford University"
                                        required
                                    />
                                </div>
                            )}
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpeningModalOpen(false)}
                                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                >
                                    Create Opening
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed top-8 right-8 z-[110] pointer-events-none">
                    <div className={`px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] border animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-xl flex items-center gap-3 ${toast.type === 'error'
                        ? 'bg-red-600 text-white border-red-400/50'
                        : 'bg-emerald-600 text-white border-emerald-400/50'
                        }`}>
                        <span className="material-symbols-outlined text-[18px]">
                            {toast.type === 'error' ? 'report' : 'verified'}
                        </span>
                        {toast.message}
                    </div>
                </div>
            )}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-black text-vibrant-primary">Delete Team?</h3>
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
                                onClick={confirmDeleteTeam}
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
