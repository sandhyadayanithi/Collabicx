import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
    applyToTeamOpening,
    getUserTeams,
    listenToMyApplications,
    listenToTeamOpenings,
    withdrawApplication,
    logout
} from '../firebase/functions';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const ROLE_OPTIONS = ['Frontend', 'Backend', 'AI', 'Design', 'Product', 'Marketing', 'DevOps'];

const Toast = ({ message, type }) => (
    <div className={`px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] border animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-xl flex items-center gap-3 ${type === 'error'
        ? 'bg-red-600 text-white border-red-400/50'
        : 'bg-emerald-600 text-white border-emerald-400/50'
        }`}>
        <span className="material-symbols-outlined text-[18px]">
            {type === 'error' ? 'report' : 'verified'}
        </span>
        {message}
    </div>
);

export default function Discover() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [openings, setOpenings] = useState([]);
    const [leadCache, setLeadCache] = useState({});
    const [search, setSearch] = useState('');
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [collegeFilter, setCollegeFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [userTeams, setUserTeams] = useState([]);
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    const [applyModal, setApplyModal] = useState({ open: false, opening: null });
    const [githubUrl, setGithubUrl] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [myApplications, setMyApplications] = useState([]);
    const prevAppStatus = useRef(new Map());

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) return navigate('/login');
            const snap = await getDoc(doc(db, 'users', user.uid));
            if (snap.exists()) setUserData({ id: user.uid, ...snap.data() });
            try {
                const teams = await getUserTeams(user.uid);
                setUserTeams(teams);
            } catch (error) {
                console.error("Error fetching teams:", error);
            }
        });
        return () => unsub();
    }, [navigate]);

    useEffect(() => {
        const unsub = listenToTeamOpenings((data) => {
            setOpenings(data);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const fetchLead = async (userId) => {
            if (!userId || leadCache[userId]) return;
            const snap = await getDoc(doc(db, 'users', userId));
            if (snap.exists()) {
                setLeadCache(prev => ({ ...prev, [userId]: snap.data() }));
            }
        };
        openings.forEach(opening => fetchLead(opening.createdBy));
    }, [openings, leadCache]);

    useEffect(() => {
        if (!userData?.id) return;
        const unsub = listenToMyApplications(userData.id, (apps) => {
            apps.forEach(app => {
                const prev = prevAppStatus.current.get(app.id);
                if (prev && prev !== app.status) {
                    if (app.status === 'APPROVED') {
                        pushToast(`Approved to join ${app.teamName}`, 'success');
                    }
                    if (app.status === 'REJECTED') {
                        pushToast(`Application rejected by ${app.teamName}`, 'error');
                    }
                }
                prevAppStatus.current.set(app.id, app.status);
            });
            setMyApplications(apps);
        });
        return () => unsub();
    }, [userData?.id]);

    const pushToast = (message, type = 'success') => {
        setToast({ message, type });
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 3000);
    };

    const filteredOpenings = useMemo(() => {
        return openings
            .filter(o => o.status === 'OPEN')
            .filter(o => {
                if (!search.trim()) return true;
                const term = search.toLowerCase();
                return (o.teamName || '').toLowerCase().includes(term)
                    || (o.description || '').toLowerCase().includes(term)
                    || (o.collegeScope?.collegeName || '').toLowerCase().includes(term);
            })
            .filter(o => {
                if (selectedRoles.length === 0) return true;
                return selectedRoles.some(role => (o.requiredRoles || []).includes(role));
            })
            .filter(o => {
                if (collegeFilter === 'ALL') return true;
                if (collegeFilter === 'ALL_COLLEGES') return o.collegeScope?.type === 'ALL';
                if (collegeFilter === 'MY_COLLEGE') {
                    return o.collegeScope?.type === 'ALL'
                        || (userData?.college && o.collegeScope?.collegeName?.toLowerCase() === userData.college.toLowerCase());
                }
                return true;
            });
    }, [openings, search, selectedRoles, collegeFilter, userData?.college]);

    const toggleRole = (role) => {
        setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
    };

    const isEligible = (opening) => {
        if (opening.collegeScope?.type === 'ALL') return true;
        if (!userData?.college) return false;
        return opening.collegeScope?.collegeName?.toLowerCase() === userData.college.toLowerCase();
    };

    const isAlreadyInTeam = (opening) => {
        if (!opening?.teamId) return false;
        return userTeams.some(team => team.id === opening.teamId);
    };

    const hasApplied = (opening) => {
        return myApplications.some(app => app.teamOpeningId === opening.id && app.status !== 'WITHDRAWN');
    };

    const openApply = (opening) => {
        setApplyModal({ open: true, opening });
        setGithubUrl('');
        setMessage('');
    };

    const submitApplication = async () => {
        if (!applyModal.opening || !userData?.id) return;
        if (!githubUrl.trim()) {
            pushToast('GitHub profile URL is required.', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            await applyToTeamOpening({
                openingId: applyModal.opening.id,
                applicantId: userData.id,
                githubUrl: githubUrl.trim(),
                message: message.trim(),
                applicantCollege: userData.college || ''
            });
            pushToast('Application submitted.', 'success');
            setApplyModal({ open: false, opening: null });
        } catch (error) {
            pushToast(error.message || 'Failed to apply.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWithdraw = async (applicationId) => {
        try {
            await withdrawApplication(applicationId, userData?.id);
            pushToast('Application withdrawn.', 'success');
        } catch (error) {
            pushToast(error.message || 'Failed to withdraw.', 'error');
        }
    };

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
        <div className="text-slate-900 dark:text-slate-100 font-display min-h-screen flex bg-background-light dark:bg-[#072724]">
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
                <a
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-black dark:text-emerald-300/80 hover:bg-slate-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    onClick={() => navigate('/teams')}
                >
                    <span className="material-symbols-outlined shrink-0">groups</span>
                    <p className="text-sm font-black">My Teams</p>
                </a>
                <a
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-500/10 border-l-[3px] border-emerald-500 text-emerald-500 transition-colors cursor-pointer"
                >
                    <span className="material-symbols-outlined shrink-0">explore</span>
                    <p className="text-sm font-black">Discover</p>
                </a>
            </Sidebar>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* Main Content (Left) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
                    <div className="max-w-5xl mx-auto space-y-10">
                        {/* Header */}
                        <header className="space-y-4">
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white mb-2">Discover Teams</h1>
                                <p className="text-slate-400 font-medium">Find your next project. Join. Build. Grow.</p>
                            </div>

                            {/* Unified Toolbar */}
                            <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 lg:p-6 space-y-4 shadow-xl">
                                <div className="flex flex-wrap items-center gap-4">
                                    {/* Search Bar */}
                                    <div className="relative flex-1 min-w-[280px]">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                            <span className="material-symbols-outlined text-[20px]">search</span>
                                        </span>
                                        <input
                                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
                                            placeholder="Search by team, idea, or college..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>

                                    {/* Scope Filters */}
                                    <div className="flex items-center bg-slate-800/50 p-1 rounded-xl border border-white/5 h-fit overflow-hidden">
                                        {[
                                            { id: 'ALL', label: 'All' },
                                            { id: 'ALL_COLLEGES', label: 'All Colleges' },
                                            { id: 'MY_COLLEGE', label: 'My College' }
                                        ].map(option => (
                                            <button
                                                key={option.id}
                                                onClick={() => setCollegeFilter(option.id)}
                                                className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all ${collegeFilter === option.id
                                                    ? 'bg-emerald-500 text-emerald-950 shadow-lg'
                                                    : 'text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Skills Toolbar */}
                                <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                        {ROLE_OPTIONS.map(role => (
                                            <button
                                                key={role}
                                                onClick={() => toggleRole(role)}
                                                className={`whitespace-nowrap px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${selectedRoles.includes(role)
                                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                                                    : 'bg-slate-800/30 border-white/10 text-slate-400 hover:border-slate-500'
                                                    }`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="hidden lg:flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">My College:</span>
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase">
                                            {userData?.college || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <div className="space-y-6">
                            <h2 className="text-lg font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-3">
                                <span className="w-8 h-px bg-emerald-500/30"></span>
                                Open Team Opportunities
                                <span className="w-8 h-px bg-emerald-500/30"></span>
                            </h2>

                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-[280px] bg-white/5 rounded-3xl animate-pulse border border-white/10"></div>
                                    ))}
                                </div>
                            ) : filteredOpenings.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-center bg-slate-900/40 rounded-[2rem] border border-dashed border-white/10">
                                    <div className="size-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                                        <span className="material-symbols-outlined text-4xl text-slate-600">rocket_launch</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No team openings yet</h3>
                                    <p className="text-slate-500 font-medium max-w-xs mx-auto">Be the first to create one and start recruiting for your project!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filteredOpenings.map(opening => (
                                        <div key={opening.id} className="group relative bg-[#0d1321] border border-white/5 rounded-3xl p-6 transition-all hover:bg-[#11192d] hover:border-emerald-500/30 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5),0_0_20px_rgba(16,185,129,0.05)] flex flex-col h-full transform hover:-translate-y-1 duration-300 overflow-hidden">
                                            {/* Glow Effect */}
                                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full group-hover:bg-emerald-500/10 transition-colors"></div>

                                            <div className="flex items-start justify-between mb-4 relative z-10">
                                                <div className="flex-1 pr-4">
                                                    <h3 className="text-xl font-black text-white leading-tight mb-1">{opening.teamName}</h3>
                                                    <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-[14px]">person</span>
                                                        Lead: {leadCache[opening.createdBy]?.name || '...'}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 flex flex-col items-end gap-2">
                                                    <span className={`px-2 py-1 text-[9px] font-black uppercase border rounded-lg ${opening.collegeScope?.type === 'ALL'
                                                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                        }`}>
                                                        {opening.collegeScope?.type === 'ALL' ? 'All Colleges' : (opening.collegeScope?.collegeName || 'Selected')}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 rounded-lg border border-white/5">
                                                        <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                                        <span className="text-[10px] font-black text-white">{opening.slotsOpen} Open</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-slate-400 text-xs font-medium mb-6 line-clamp-3 leading-relaxed relative z-10">
                                                {opening.description || 'No description provided'}
                                            </p>

                                            <div className="mt-auto space-y-5 relative z-10">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {(opening.requiredRoles || []).map(role => (
                                                        <span key={role} className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-slate-800 text-slate-400">
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>

                                                <button
                                                    disabled={!isEligible(opening) || isAlreadyInTeam(opening) || hasApplied(opening)}
                                                    onClick={() => openApply(opening)}
                                                    className={`w-full py-3.5 rounded-xl font-black transition-all text-xs tracking-widest uppercase shadow-lg ${!isEligible(opening) || isAlreadyInTeam(opening) || hasApplied(opening)
                                                        ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-white/5'
                                                        : 'bg-emerald-600 hover:bg-emerald-500 text-emerald-950 hover:shadow-emerald-500/20 active:translate-y-0.5'
                                                        }`}
                                                >
                                                    {isAlreadyInTeam(opening) ? 'Already in Team' : (hasApplied(opening) ? 'Already Applied' : (isEligible(opening) ? 'Apply to Join' : 'Not Eligible'))}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Applications Sidebar (Right) */}
                <aside className="hidden md:flex w-[320px] shrink-0 flex-col border-l border-white/10 bg-[#0a0f1c]/80 backdrop-blur-xl sticky top-0 h-screen overflow-hidden">
                    <div className="p-6 border-b border-white/5">
                        <h3 className="text-lg font-black text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-emerald-500">assignment_turned_in</span>
                            My Applications
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                        {myApplications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-60">
                                <span className="material-symbols-outlined text-5xl">inbox</span>
                                <p className="text-sm font-black uppercase tracking-widest leading-loose text-white">
                                    Apply to teams to see them here 🚀
                                </p>
                            </div>
                        ) : (
                            myApplications.map(app => (
                                <div key={app.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3 hover:border-emerald-500/20 transition-all group">
                                    <div className="flex items-start justify-between">
                                        <h4 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{app.teamName}</h4>
                                        <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${app.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                                            app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' :
                                                'bg-red-500/10 text-red-500'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <a
                                            href={app.githubUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] font-black text-slate-500 hover:text-white transition-colors flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">link</span>
                                            GITHUB
                                        </a>
                                        {app.status === 'PENDING' && (
                                            <button
                                                onClick={() => handleWithdraw(app.id)}
                                                className="text-[10px] font-black text-red-500/60 hover:text-red-500 uppercase tracking-widest"
                                            >
                                                WITHDRAW
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-6 bg-emerald-500/5 border-t border-white/5">
                        <div className="flex items-center justify-between text-[10px] font-black tracking-[0.2em] text-emerald-500/50">
                            <span>MARKETPLACE ACTIVE</span>
                            <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Application Modal */}
            {applyModal.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0d1321] w-full max-w-lg rounded-[2rem] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-white">Apply for {applyModal.opening?.teamName}</h3>
                                <p className="text-sm text-slate-500 font-bold mt-1">Tell the lead why you're the perfect fit.</p>
                            </div>
                            <button
                                onClick={() => setApplyModal({ open: false, opening: null })}
                                className="size-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-500">GitHub Profile URL</label>
                                <input
                                    type="url"
                                    value={githubUrl}
                                    onChange={(e) => setGithubUrl(e.target.value)}
                                    placeholder="https://github.com/yourhandle"
                                    className="w-full px-5 py-3.5 bg-slate-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all text-sm font-bold text-white placeholder:text-slate-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-500">Short Pitch</label>
                                <textarea
                                    rows="4"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Briefly state your skills and motivation..."
                                    className="w-full px-5 py-3.5 bg-slate-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all text-sm font-bold text-white placeholder:text-slate-700 resize-none"
                                />
                            </div>
                        </div>
                        <div className="p-8 bg-slate-900/50 border-t border-white/5 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setApplyModal({ open: false, opening: null })}
                                className="flex-1 py-4 bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitApplication}
                                disabled={isSubmitting}
                                className="flex-1 py-4 bg-emerald-600 text-emerald-950 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Sending...' : 'Send Application'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed top-8 right-8 z-[110]">
                    <Toast message={toast.message} type={toast.type} />
                </div>
            )}
        </div>
    );
}
