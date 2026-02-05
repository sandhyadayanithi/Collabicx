import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
    applyToTeamOpening,
    getUserTeams,
    listenToMyApplications,
    listenToTeamOpenings,
    withdrawApplication
} from '../firebase/functions';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const ROLE_OPTIONS = ['Frontend', 'Backend', 'AI', 'Design', 'Product', 'Marketing', 'DevOps'];

const Toast = ({ message, type }) => (
    <div className={`px-4 py-3 rounded-xl text-sm font-bold shadow-lg border ${type === 'error'
        ? 'bg-red-500/10 text-red-500 border-red-500/20'
        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        }`}>
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
    }, [openings]);

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

    return (
        <div className="text-slate-900 dark:text-slate-100 font-display min-h-screen flex">
            <Sidebar
                showLogo={true}
                footer={null}
            >
                <a
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-black dark:text-emerald-300/80 hover:bg-slate-100 dark:hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    onClick={() => navigate('/teams')}
                >
                    <span className="material-symbols-outlined dark:text-emerald-300/80">groups</span>
                    <p className="text-sm font-black">My Teams</p>
                </a>
                <a
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 dark:bg-emerald-500/20 border-l-[3px] border-primary dark:border-emerald-400 text-primary dark:text-emerald-400 transition-colors cursor-pointer"
                >
                    <span className="material-symbols-outlined dark:text-emerald-400">explore</span>
                    <p className="text-sm font-black">Discover</p>
                </a>
            </Sidebar>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <header className="max-w-300 w-full mx-auto px-8 pt-10 pb-6">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-vibrant-primary text-4xl font-black tracking-tight">Discover Teams</h2>
                            <p className="text-vibrant-secondary font-black">Find teams looking for members and apply in minutes.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">College</span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold vibrant-badge">
                                {userData?.college || 'Not set'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <label className="relative block">
                            <span className="absolute inset-y-0 left-0 w-11 flex items-center justify-center text-slate-600 pointer-events-none">
                                <span className="material-symbols-outlined text-lg leading-none">search</span>
                            </span>
                            <input
                                className="block w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl py-3 pl-11 pr-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm placeholder:text-slate-500 text-vibrant-primary font-black"
                                placeholder="Search by team name, idea, or college..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </label>

                        <div className="flex items-center gap-2 flex-wrap">
                            {ROLE_OPTIONS.map(role => (
                                <button
                                    key={role}
                                    onClick={() => toggleRole(role)}
                                    className={`px-3 py-2 text-xs font-black rounded-lg border transition-all ${selectedRoles.includes(role)
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-primary/50'
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            {[
                                { id: 'ALL', label: 'All Openings' },
                                { id: 'ALL_COLLEGES', label: 'All Colleges' },
                                { id: 'MY_COLLEGE', label: 'My College' }
                            ].map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => setCollegeFilter(option.id)}
                                    className={`px-3 py-2 text-xs font-black rounded-lg border transition-all ${collegeFilter === option.id
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-primary/50'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <section className="max-w-[1200px] w-full mx-auto px-8 py-6 space-y-8">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredOpenings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center vibrant-card rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
                            <span className="material-symbols-outlined text-5xl text-slate-400 mb-4">search_off</span>
                            <h3 className="text-lg font-black text-vibrant-primary">No openings match your filters</h3>
                            <p className="text-slate-500 font-bold text-sm">Try adjusting search or roles.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredOpenings.map(opening => (
                                <div key={opening.id} className="vibrant-card rounded-2xl border border-slate-300 dark:border-white/10 p-6 shadow-md flex flex-col gap-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-black text-vibrant-primary">{opening.teamName}</h3>
                                            <p className="text-xs font-black text-vibrant-secondary">{opening.description || 'No description provided'}</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">
                                                Lead: {leadCache[opening.createdBy]?.name || 'Team Lead'}
                                            </p>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${opening.collegeScope?.type === 'ALL'
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : 'bg-blue-500/10 text-blue-500'
                                            }`}>
                                            {opening.collegeScope?.type === 'ALL'
                                                ? 'All Colleges'
                                                : opening.collegeScope?.collegeName || 'College Only'}
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

                                    <button
                                        disabled={!isEligible(opening) || isAlreadyInTeam(opening)}
                                        onClick={() => openApply(opening)}
                                        className={`w-full h-11 rounded-xl font-black transition-all shadow-lg ${!isEligible(opening) || isAlreadyInTeam(opening)
                                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                            : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
                                            }`}
                                    >
                                        {isAlreadyInTeam(opening) ? 'Already in Team' : (isEligible(opening) ? 'Apply to Join' : 'Not Eligible')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="max-w-[1200px] w-full mx-auto px-8 py-6">
                    <div className="vibrant-card rounded-2xl border border-slate-300 dark:border-white/10 p-6 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-vibrant-primary">My Applications</h3>
                        </div>
                        {myApplications.length === 0 ? (
                            <p className="text-sm text-slate-500 font-bold">No applications yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {myApplications.map(app => (
                                    <div key={app.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <div>
                                            <p className="text-sm font-black text-vibrant-primary">{app.teamName}</p>
                                            <p className="text-[11px] font-bold text-slate-500">Status: {app.status}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {app.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleWithdraw(app.id)}
                                                    className="px-3 py-2 text-xs font-black rounded-lg bg-red-500/10 text-red-500"
                                                >
                                                    Withdraw
                                                </button>
                                            )}
                                            <a
                                                href={app.githubUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-black text-primary hover:underline"
                                            >
                                                GitHub
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {applyModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Apply to {applyModal.opening?.teamName}</h3>
                                <p className="text-xs text-slate-500 font-bold">Share your GitHub profile and a short note.</p>
                            </div>
                            <button onClick={() => setApplyModal({ open: false, opening: null })} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">GitHub Profile URL</label>
                                <input
                                    type="url"
                                    value={githubUrl}
                                    onChange={(e) => setGithubUrl(e.target.value)}
                                    placeholder="https://github.com/yourname"
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Message (Optional)</label>
                                <textarea
                                    rows="4"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Why you're a good fit..."
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 dark:text-white resize-none"
                                />
                            </div>
                            <div className="text-xs font-bold text-slate-500">
                                Eligibility: {isEligible(applyModal.opening) ? 'Eligible' : 'Not eligible for this college scope'}
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setApplyModal({ open: false, opening: null })}
                                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitApplication}
                                disabled={isSubmitting}
                                className="flex-1 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed top-6 right-6 z-[60]">
                    <Toast message={toast.message} type={toast.type} />
                </div>
            )}
        </div>
    );
}
