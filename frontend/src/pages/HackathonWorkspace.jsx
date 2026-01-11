import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import ChatSidebar from '../components/ChatSidebar';

export default function HackathonWorkspace() {
    const [showChat, setShowChat] = useState(true);

    // -- State: Quick Notes --
    const [noteContent, setNoteContent] = useState("");
    const [lastSaved, setLastSaved] = useState(null);

    const handleNoteChange = (e) => {
        setNoteContent(e.target.value);
    };

    const saveNote = () => {
        setLastSaved(new Date());
        // In a real app, save to DB here
    };

    // -- State: Sprint Tasks --
    const [tasks, setTasks] = useState([
        { id: 1, title: 'Finalize Figma Prototyping', category: 'Design', completed: true },
        { id: 2, title: 'Integrate OpenAI API endpoints', category: 'Development', completed: false, tag: 'BLOCKER' },
    ]);
    const [newTaskTitle, setNewTaskTitle] = useState("");

    // -- State: Task Modal --
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTaskCategory, setNewTaskCategory] = useState("General");

    const toggleTask = (id) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const addTask = () => {
        setNewTaskTitle("");
        setNewTaskCategory("General");
        setIsTaskModalOpen(true);
    };

    const handleAddTaskSubmit = (e) => {
        e.preventDefault();
        if (newTaskTitle.trim()) {
            setTasks(prev => [...prev, {
                id: Date.now(),
                title: newTaskTitle,
                category: newTaskCategory,
                completed: false
            }]);
            setIsTaskModalOpen(false);
        }
    };

    const completedCount = tasks.filter(t => t.completed).length;
    const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

    // -- State: Submission Assets --
    const [assets, setAssets] = useState([
        { id: 1, type: 'github', title: 'GitHub Repository', url: 'github.com/team-alpha/ai-hack', icon: 'code', color: 'bg-slate-900' },
    ]);

    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [newAssetTitle, setNewAssetTitle] = useState("");
    const [newAssetUrl, setNewAssetUrl] = useState("");

    const addAsset = () => {
        setNewAssetTitle("");
        setNewAssetUrl("");
        setIsAssetModalOpen(true);
    };

    const handleAddAssetSubmit = (e) => {
        e.preventDefault();
        if (newAssetUrl.trim()) {
            let type = 'link';
            let icon = 'link';
            let color = 'bg-slate-500';

            const url = newAssetUrl.toLowerCase();
            if (url.includes('github')) { type = 'github'; icon = 'code'; color = 'bg-slate-900'; }
            else if (url.includes('figma')) { type = 'figma'; icon = 'design_services'; color = 'bg-pink-500'; }
            else if (url.includes('youtube') || url.includes('loom')) { type = 'video'; icon = 'video_library'; color = 'bg-red-500'; }

            setAssets(prev => [...prev, {
                id: Date.now(),
                type,
                title: newAssetTitle.trim() || 'New Asset',
                url: newAssetUrl,
                icon,
                color
            }]);
            setIsAssetModalOpen(false);
        }
    };

    const old_addAsset = () => {
        const url = prompt("Enter asset URL:");
        if (url) {
            let type = 'link';
            let icon = 'link';
            let color = 'bg-slate-500';

            if (url.includes('github')) { type = 'github'; icon = 'code'; color = 'bg-slate-900'; }
            else if (url.includes('figma')) { type = 'figma'; icon = 'design_services'; color = 'bg-pink-500'; }
            else if (url.includes('youtube') || url.includes('loom')) { type = 'video'; icon = 'video_library'; color = 'bg-red-500'; }

            setAssets(prev => [...prev, { id: Date.now(), type, title: 'New Asset', url, icon, color }]);
        }
    };

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

                    {/* Left Column: Shared Editor (Notes) */}
                    <section className="lg:col-span-4 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-background-dark/50">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Quick Notes</h3>
                            <div className="flex items-center gap-2">
                                <span className={`flex h-2 w-2 rounded-full ${lastSaved ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                <span className="text-[10px] font-medium text-slate-400">{lastSaved ? 'SAVED' : 'UNSAVED'}</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="flex flex-col h-full">
                                <div className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                                    <textarea
                                        value={noteContent}
                                        onChange={handleNoteChange}
                                        className="w-full h-full resize-none bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono text-sm leading-relaxed"
                                        placeholder="Start typing ideas, snippets, or reminders..."
                                    ></textarea>
                                </div>
                                <div className="mt-4 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-1">
                                        <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors" title="Bold">
                                            <span className="material-symbols-outlined text-slate-500 text-lg">format_bold</span>
                                        </button>
                                        <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors" title="Italic">
                                            <span className="material-symbols-outlined text-slate-500 text-lg">format_italic</span>
                                        </button>
                                        <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors" title="Link">
                                            <span className="material-symbols-outlined text-slate-500 text-lg">link</span>
                                        </button>
                                        <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors" title="Code Block">
                                            <span className="material-symbols-outlined text-slate-500 text-lg">code</span>
                                        </button>
                                    </div>
                                    <button onClick={saveNote} className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors">
                                        SAVE NOTE
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Center Column: Task Checklist */}
                    <section className="lg:col-span-5 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-background-dark">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Sprint Tasks</h3>
                                <button onClick={addTask} className="text-primary hover:text-blue-400 flex items-center gap-1 text-sm font-bold">
                                    <span className="material-symbols-outlined text-sm">add</span> Add Task
                                </button>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{progress}%</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{completedCount} of {tasks.length} tasks completed</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${progress >= 50 ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                            {progress >= 50 ? 'On Track' : 'In Progress'}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-2">
                                {tasks.map(task => (
                                    <div key={task.id} className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg group transition-all ${task.completed ? 'opacity-60' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={task.completed}
                                            onChange={() => toggleTask(task.id)}
                                            className="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary bg-transparent size-4 cursor-pointer"
                                        />
                                        <div className="flex-1">
                                            <p className={`text-sm text-slate-900 dark:text-slate-100 font-medium ${task.completed ? 'line-through text-slate-500' : ''}`}>
                                                {task.title}
                                            </p>
                                        </div>
                                        {task.tag && (
                                            <div className="bg-orange-500/10 text-orange-500 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{task.tag}</div>
                                        )}
                                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-lg opacity-0 group-hover:opacity-100 cursor-grab">drag_indicator</span>
                                    </div>
                                ))}
                                {tasks.length === 0 && (
                                    <p className="text-center text-slate-400 text-sm py-8 italic">No tasks yet. Add one to get started!</p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Right Column: Submission Hub (Assets) */}
                    <section className="lg:col-span-3 flex flex-col bg-slate-50 dark:bg-background-dark/80">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Submission Assets</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {assets.map(asset => (
                                <div key={asset.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/50 group">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-10 ${asset.color || 'bg-slate-500'} text-white rounded-lg flex items-center justify-center`}>
                                                <span className="material-symbols-outlined">
                                                    {asset.icon || 'link'}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">{asset.title}</h5>
                                                <a href={`https://${asset.url}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-primary truncate block max-w-[150px]">{asset.url}</a>
                                            </div>
                                        </div>
                                        <a href={`https://${asset.url}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-lg">open_in_new</span>
                                        </a>
                                    </div>
                                    <button className="text-slate-400 hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-lg">open_in_new</span>
                                    </button>
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded">Last commit 12m ago</span>
                                    </div>
                                </div>
                            ))}

                            <button onClick={addAsset} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                <span className="material-symbols-outlined text-sm">add_link</span> Add New Asset
                            </button>
                        </div>
                    </section >
                </main >

                {/* Right Chat Sidebar (Collapsible) */}
                {
                    showChat && (
                        <ChatSidebar
                            teamId="hackathon-global-ai-2024"
                            onClose={() => setShowChat(false)}
                        />
                    )
                }
            </div >

            {/* Asset Input Modal */}
            {
                isAssetModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add New Asset</h3>
                                    <button onClick={() => setIsAssetModalOpen(false)} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <form onSubmit={handleAddAssetSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Asset Title</label>
                                        <input
                                            type="text"
                                            value={newAssetTitle}
                                            onChange={(e) => setNewAssetTitle(e.target.value)}
                                            placeholder="e.g., Design System"
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 dark:text-white"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">URL</label>
                                        <input
                                            type="text"
                                            value={newAssetUrl}
                                            onChange={(e) => setNewAssetUrl(e.target.value)}
                                            placeholder="e.g., figma.com/..."
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsAssetModalOpen(false)}
                                            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                        >
                                            Add Asset
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Asset Input Modal */}
            {
                isAssetModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add New Asset</h3>
                                    <button onClick={() => setIsAssetModalOpen(false)} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <form onSubmit={handleAddAssetSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Asset Title</label>
                                        <input
                                            type="text"
                                            value={newAssetTitle}
                                            onChange={(e) => setNewAssetTitle(e.target.value)}
                                            placeholder="e.g., Design System"
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 dark:text-white"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">URL</label>
                                        <input
                                            type="text"
                                            value={newAssetUrl}
                                            onChange={(e) => setNewAssetUrl(e.target.value)}
                                            placeholder="e.g., figma.com/..."
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsAssetModalOpen(false)}
                                            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                        >
                                            Add Asset
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Task Input Modal */}
            {
                isTaskModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add New Task</h3>
                                    <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <form onSubmit={handleAddTaskSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Task Title</label>
                                        <input
                                            type="text"
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            placeholder="e.g., Design Login Flow"
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 dark:text-white"
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Category</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Design', 'Development', 'General'].map(cat => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => setNewTaskCategory(cat)}
                                                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${newTaskCategory === cat ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary/50'}`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsTaskModalOpen(false)}
                                            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                        >
                                            Add Task
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
