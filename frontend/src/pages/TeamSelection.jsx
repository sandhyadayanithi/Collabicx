import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { createTeam, joinTeamByCode } from '../firebase/functions';
import { auth } from '../firebase/config';

export default function TeamSelection() {
    const navigate = useNavigate();
    const [teamName, setTeamName] = useState('');
    const [teamDescription, setTeamDescription] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateTeam = async (e) => {
        e.stopPropagation();
        if (!teamName.trim()) {
            setError('Please enter a team name');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const user = auth.currentUser;
            if (!user) {
                navigate('/login');
                return;
            }

            await createTeam(teamName, teamDescription, user.uid);
            navigate('/teams');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinTeam = async (e) => {
        e.stopPropagation();
        if (!joinCode.trim()) {
            setError('Please enter a join code');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const user = auth.currentUser;
            if (!user) {
                navigate('/login');
                return;
            }

            await joinTeamByCode(joinCode.toUpperCase(), user.uid);
            navigate('/teams');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
            {/* Top Navigation */}
            <Header title="Collabicx" hideSearch={true}>
                <a className="text-slate-600 dark:text-slate-300 text-sm font-medium hover:text-primary transition-colors" href="#">Dashboard</a>
                <a className="text-slate-600 dark:text-slate-300 text-sm font-medium hover:text-primary transition-colors" href="#">Projects</a>
                <a className="text-slate-600 dark:text-slate-300 text-sm font-medium hover:text-primary transition-colors" href="#">Support</a>
            </Header>

            {/* Main Content */}
            <main className="flex-grow flex items-center justify-center px-4 py-12 md:py-20">
                <div className="w-full max-w-[1100px] flex flex-col gap-12">
                    {/* Page Heading */}
                    <div className="text-center max-w-2xl mx-auto flex flex-col gap-4">
                        <h1 className="text-slate-900 text-white-forced text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em]">Join the Innovation</h1>
                        <p className="text-slate-500 dark:text-[#9da6b9] text-lg font-normal leading-normal">Start your journey by forming a new squad or joining an existing one.</p>
                    </div>

                    {/* Action Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch relative">
                        {/* Vertical Divider (Visible on Desktop) */}
                        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 size-12 items-center justify-center rounded-full bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-800">
                            <span className="text-xs font-bold text-slate-400">OR</span>
                        </div>

                        {/* Create Team Card */}
                        <div className="flex flex-col bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg hover:shadow-primary/5 transition-all p-8 group overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-3xl">group_add</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create a Team</h2>
                                    <p className="text-sm text-slate-500 dark:text-[#9da6b9]">Form your own squad and lead the way.</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-6">
                                <label className="flex flex-col gap-2">
                                    <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold">Team Name</p>
                                    <input
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 dark:border-[#3b4354] bg-slate-50 dark:bg-[#111318] text-slate-900 dark:text-white focus:ring-primary focus:border-primary h-12 px-4 placeholder:text-slate-400 dark:placeholder:text-[#9da6b9]"
                                        placeholder="e.g. Pixel Pioneers"
                                        type="text"
                                    />
                                </label>
                                <label className="flex flex-col gap-2">
                                    <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold">Description</p>
                                    <textarea
                                        value={teamDescription}
                                        onChange={(e) => setTeamDescription(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 dark:border-[#3b4354] bg-slate-50 dark:bg-[#111318] text-slate-900 dark:text-white focus:ring-primary focus:border-primary min-h-[100px] p-4 placeholder:text-slate-400 dark:placeholder:text-[#9da6b9] resize-none"
                                        placeholder="What is your team's mission?"
                                    ></textarea>
                                </label>
                                <button
                                    onClick={handleCreateTeam}
                                    disabled={loading}
                                    className="w-full mt-2 h-12 bg-primary text-white rounded-lg font-bold text-base hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
                                >
                                    <span>{loading ? 'Creating...' : 'Initialize Team'}</span>
                                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                </button>
                            </div>
                        </div>

                        {/* Join Team Card */}
                        <div className="flex flex-col bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg hover:shadow-primary/5 transition-all p-8 group overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-3xl">key</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Join a Team</h2>
                                    <p className="text-sm text-slate-500 dark:text-[#9da6b9]">Already have an invite? Enter it below.</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-6 justify-between flex-grow">
                                <div className="flex flex-col gap-6">
                                    <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4 border border-primary/10">
                                        <p className="text-xs font-medium text-primary uppercase tracking-wider mb-2">Team Highlight</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 italic">"Joining a team allows you to collaborate on existing projects and share tasks instantly."</p>
                                    </div>
                                    <label className="flex flex-col gap-2">
                                        <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold">Unique Invite Code</p>
                                        <input
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 dark:border-[#3b4354] bg-slate-50 dark:bg-[#111318] text-slate-900 dark:text-white focus:ring-primary focus:border-primary h-14 px-4 text-center text-xl font-mono tracking-widest placeholder:text-slate-400 dark:placeholder:text-[#9da6b9] placeholder:font-sans placeholder:tracking-normal placeholder:text-base"
                                            placeholder="XXXX-XXXX-XXXX"
                                            type="text"
                                        />
                                    </label>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={handleJoinTeam}
                                        disabled={loading}
                                        className="w-full h-12 bg-primary text-white rounded-lg font-bold text-base hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
                                    >
                                        <span>{loading ? 'Joining...' : 'Enter Team'}</span>
                                        <span className="material-symbols-outlined text-sm">login</span>
                                    </button>
                                    <p className="text-xs text-center text-slate-400 dark:text-slate-500 px-4">
                                        Need a code? Ask your team lead to find it in their team settings dashboard.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Stats */}
            <footer className="mt-auto py-8 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-[1100px] mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-20 opacity-60">

                </div>
            </footer>
        </div>
    );
}
