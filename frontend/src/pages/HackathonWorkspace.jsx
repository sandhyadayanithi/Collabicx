import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { updateQuickNote, listenToQuickNote, sendMessage, listenToMessages } from '../firebase/functions';
import { auth } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore'; // For user fetching if needed, or stick to simple
import { db } from '../firebase/config';

const TEAM_ID = "team-alpha-bits-id";
const HACKATHON_ID = "hackathon-1";

export default function HackathonWorkspace() {
    const [showChat, setShowChat] = useState(true);
    const currentUser = auth.currentUser;

    // -- State: Chat --
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const [userData, setUserData] = useState(null);

    // Fetch user data for chat
    useEffect(() => {
        if (currentUser) {
            getDoc(doc(db, "users", currentUser.uid)).then(snap => {
                if (snap.exists()) setUserData(snap.data());
            });
        }
    }, [currentUser]);

    // Chat Listeners
    useEffect(() => {
        const unsubscribe = listenToMessages(TEAM_ID, (msgs) => {
            setMessages(msgs);
            // Scroll to bottom on new messages?
            // messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        });
        return () => unsubscribe();
    }, []);

    // Scroll effect when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !currentUser) return;
        try {
            const name = userData?.username || userData?.name || "User";
            const avatar = userData?.avatar || "";
            await sendMessage(TEAM_ID, currentUser.uid, newMessage, name, avatar);
            setNewMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleChatKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // -- State: Quick Notes --
    const [noteContent, setNoteContent] = useState("");
    const [lastSaved, setLastSaved] = useState(null);
    const noteContentRef = useRef(noteContent);
    const isTypingRef = useRef(false);

    // Load initial note and listen for changes
    useEffect(() => {
        const unsubscribe = listenToQuickNote(TEAM_ID, HACKATHON_ID, (content) => {
            // Only update from DB if we aren't currently typing to avoid overwriting ourselves immediately
            // or better, just always update and let React handle diffs? 
            // If we are typing, we might have local changes that are newer.
            // For now, let's sync. If user says "real time", we should show updates.
            if (!isTypingRef.current) {
                setNoteContent(content || "");
                noteContentRef.current = content || "";
            }
        });
        return () => unsubscribe();
    }, []);

    const handleNoteChange = (e) => {
        setNoteContent(e.target.value);
        noteContentRef.current = e.target.value;
        isTypingRef.current = true;
        setLastSaved(null); // Mark as unsaved while typing

        // Clear typing flag after a delay
        if (window.typingTimeout) clearTimeout(window.typingTimeout);
        window.typingTimeout = setTimeout(() => {
            isTypingRef.current = false;
        }, 2000);
    };

    // Autosave on unmount
    useEffect(() => {
        return () => {
            if (noteContentRef.current) {
                console.log("Autosaving note on navigation:", noteContentRef.current);
                updateQuickNote(TEAM_ID, HACKATHON_ID, noteContentRef.current);
            }
        };
    }, []);

    const saveNote = async () => {
        try {
            await updateQuickNote(TEAM_ID, HACKATHON_ID, noteContent);
            setLastSaved(new Date());
        } catch (error) {
            console.error("Failed to save note:", error);
        }
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
            <Header title="Global AI Hack 2024" backPath="/dashboard">

            </Header>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Workspace Grid */}
                <main className="flex-1 grid grid-cols-1 lg:grid-cols-10 gap-6 p-6 overflow-hidden bg-slate-50 dark:bg-slate-900/50">

                    {/* Left Column: Quick Notes */}
                    <section className="lg:col-span-3 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col bg-white dark:bg-background-dark/50">
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
                                        placeholder="Start typing ideas..."
                                    ></textarea>
                                </div>
                                <div className="mt-2 flex justify-end">
                                    <button
                                        onClick={saveNote}
                                        disabled={lastSaved}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${lastSaved
                                            ? 'bg-green-500/10 text-green-500 cursor-default'
                                            : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20'
                                            }`}
                                    >
                                        {lastSaved ? 'SAVED' : 'SAVE NOTE'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Center Column: Team Chat */}
                    <section className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col bg-white dark:bg-background-dark/50">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">chat_bubble</span>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Team Chat</h3>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Today</span>
                                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                            </div>
                            {messages.map((msg) => {
                                const isMe = msg.userId === currentUser?.uid;
                                return (
                                    <div key={msg.id} className={`flex flex-col gap-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {!isMe && (
                                                <div
                                                    className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 bg-cover bg-center border border-slate-300 dark:border-slate-600"
                                                    style={msg.userAvatar ? { backgroundImage: `url(${msg.userAvatar})` } : {}}
                                                >
                                                    {!msg.userAvatar && (
                                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center h-full w-full">
                                                            {(msg.userName || "U").substring(0, 1).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                                                {isMe ? 'You' : (msg.userName || `User ${msg.userId.substring(0, 4)}`)}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                        <div className={`p-3 rounded-xl max-w-[85%] break-words text-sm ${isMe
                                            ? 'bg-primary text-white rounded-tr-none'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none'
                                            }`}>
                                            {msg.message}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-white/0 dark:bg-black/0 border-t border-slate-200 dark:border-slate-800 shrink-0">
                            <div className="relative">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={handleChatKeyDown}
                                    className="form-textarea w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-primary focus:border-primary text-sm min-h-[50px] max-h-[120px] py-3 pr-12 pl-4 custom-scrollbar resize-none dark:text-white dark:placeholder-slate-500"
                                    placeholder="Type a message..."
                                    rows={1}
                                    style={{ height: 'auto', minHeight: '50px' }}
                                ></textarea>
                                <button
                                    onClick={handleSendMessage}
                                    className="absolute bottom-2.5 right-2 size-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                                >
                                    <span className="material-symbols-outlined text-[18px]">send</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Right Column: Tasks & Assets */}
                    <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
                        {/* Top: Sprint Tasks */}
                        <section className="flex-1 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col bg-white dark:bg-background-dark">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Sprint Tasks</h3>
                                    <button onClick={addTask} className="text-primary hover:text-blue-400 flex items-center gap-1 text-sm font-bold">
                                        <span className="material-symbols-outlined text-sm">add</span> Add
                                    </button>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{progress}%</p>
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
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
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
                                        </div>
                                    ))}
                                    {tasks.length === 0 && (
                                        <p className="text-center text-slate-400 text-sm py-8 italic">No tasks.</p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Bottom: Submission Assets */}
                        <section className="flex-1 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col bg-white dark:bg-background-dark">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Assets</h3>
                                <button onClick={addAsset} className="text-primary hover:text-blue-400 flex items-center gap-1 text-sm font-bold">
                                    <span className="material-symbols-outlined text-sm">add</span> New
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {assets.map(asset => (
                                    <div key={asset.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/50 group flex items-center gap-3">
                                        <div className={`size-8 ${asset.color || 'bg-slate-500'} text-white rounded-lg flex items-center justify-center shrink-0`}>
                                            <span className="material-symbols-outlined text-sm">{asset.icon || 'link'}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{asset.title}</h5>
                                            <a href={`https://${asset.url}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-primary truncate block">{asset.url}</a>
                                        </div>
                                        <a href={`https://${asset.url}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                                        </a>
                                    </div>
                                ))}
                                {assets.length === 0 && (
                                    <button onClick={addAsset} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                        Add Asset
                                    </button>
                                )}
                            </div>
                        </section>
                    </div>
                </main>
            </div>

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
