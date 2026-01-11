import React, { useState } from 'react';
import Header from '../components/Header';
import ChatSidebar from '../components/ChatSidebar';

export default function HackathonWorkspace() {
    const [showChat, setShowChat] = useState(true);

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 h-screen flex flex-col font-display overflow-hidden">
            {/* Global Header */}
            <Header title="Global AI Hack 2024" hideSearch={true} showBack={true} backPath="/dashboard">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`text-sm font-medium leading-normal transition-colors flex items-center gap-2 ${showChat ? 'text-primary' : 'text-slate-500 dark:text-slate-400 hover:text-primary'}`}
                    >
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                        Chat
                    </button>
                </div>
            </Header>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Workspace Grid */}
                <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                    {/* Left Column: Shared Editor */}
                    <section className="lg:col-span-8 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-background-dark/50">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Quick Notes</h3>
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                                <span className="text-[10px] font-medium text-slate-400">SYNCED</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="flex flex-col h-full">
                                <div className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                                    <textarea className="w-full h-full resize-none bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono text-sm leading-relaxed" placeholder="Start typing ideas, snippets, or reminders..."></textarea>
                                </div>
                                <div className="mt-4 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-1">
                                        <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors">
                                            <span className="material-symbols-outlined text-slate-500 text-lg">format_bold</span>
                                        </button>
                                        <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors">
                                            <span className="material-symbols-outlined text-slate-500 text-lg">format_italic</span>
                                        </button>
                                        <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors">
                                            <span className="material-symbols-outlined text-slate-500 text-lg">link</span>
                                        </button>
                                        <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors">
                                            <span className="material-symbols-outlined text-slate-500 text-lg">code</span>
                                        </button>
                                    </div>
                                    <button className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-md">SAVE NOTE</button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Right Column: Submission Hub */}
                    <section className="lg:col-span-4 flex flex-col bg-slate-50 dark:bg-background-dark/80">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Submission Assets</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Submission Card */}
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/50">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 bg-slate-900 rounded-lg flex items-center justify-center">
                                            <svg className="size-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path></svg>
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-bold text-slate-900 dark:text-white">GitHub Repository</h5>
                                            <p className="text-[10px] text-slate-500">github.com/team-alpha/ai-hack</p>
                                        </div>
                                    </div>
                                    <button className="text-slate-400 hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-lg">open_in_new</span>
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded">Last commit 12m ago</span>
                                </div>
                            </div>

                            {/* Figma Submission Card */}
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/50">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 bg-pink-500/10 text-pink-500 rounded-lg flex items-center justify-center">
                                            <span className="material-symbols-outlined">design_services</span>
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-bold text-slate-900 dark:text-white">Figma Design</h5>
                                            <p className="text-[10px] text-slate-500">figma.com/file/hackathon-v1</p>
                                        </div>
                                    </div>
                                    <button className="text-slate-400 hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-lg">open_in_new</span>
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded">Read-only link</span>
                                </div>
                            </div>

                            {/* Loom Submission Card */}
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/50">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                                            <span className="material-symbols-outlined">video_library</span>
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-bold text-slate-900 dark:text-white">Pitch Deck (Loom)</h5>
                                            <p className="text-[10px] text-slate-500">loom.com/share/pitch-demo</p>
                                        </div>
                                    </div>
                                    <button className="text-slate-400 hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-lg">open_in_new</span>
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase">Ready for Judging</span>
                                </div>
                            </div>

                            <button className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                <span className="material-symbols-outlined text-sm">add_link</span> Add New Asset
                            </button>
                        </div>
                    </section>
                </main>

                {/* Right Chat Sidebar (Collapsible) */}
                {showChat && (
                    <ChatSidebar
                        teamId="hackathon-global-ai-2024"
                        onClose={() => setShowChat(false)}
                    />
                )}
            </div>
        </div>
    );
}
