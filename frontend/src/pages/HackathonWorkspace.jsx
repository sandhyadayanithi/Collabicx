import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import {
    updateQuickNote,
    listenToQuickNote,
    sendMessage,
    listenToMessages,
    listenToTasks,
    listenToLinks,
    toggleTaskComplete,
    addTask as firebaseAddTask,
    addLink as firebaseAddLink,
    getHackathonDetails,
    editMessage
} from '../firebase/functions';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';


export default function HackathonWorkspace() {
    const { teamId, hackathonId } = useParams();
    const navigate = useNavigate();
    const [showChat, setShowChat] = useState(true);
    const [currentUser, setCurrentUser] = useState(auth.currentUser);
    const [hackathon, setHackathon] = useState(null);
    const [loading, setLoading] = useState(true);

    // -- State: Resizing Chat --
    const [chatWidth, setChatWidth] = useState(480);
    const [isResizing, setIsResizing] = useState(false);
    const resizeStartRef = useRef(null);

    // Auth listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    // Fetch user data for chat
    const [userData, setUserData] = useState(null);

    // Fetch user data for chat
    useEffect(() => {
        if (currentUser) {
            getDoc(doc(db, "users", currentUser.uid)).then(snap => {
                if (snap.exists()) setUserData(snap.data());
            });
        }
    }, [currentUser]);

    // Fetch hackathon details
    useEffect(() => {
        if (teamId && hackathonId) {
            setLoading(true);
            getHackathonDetails(teamId, hackathonId).then(data => {
                if (data) {
                    setHackathon(data);
                    // Persistent session: Save last viewed hackathon for "Resume Work"
                    localStorage.setItem('lastViewedHackathon', JSON.stringify({ teamId, hackathonId }));
                } else {
                    // Hackathon not found, maybe redirect
                    console.error("Hackathon not found");
                }
                setLoading(false);
            }).catch(err => {
                console.error("Error fetching hackathon:", err);
                setLoading(false);
            });
        }
    }, [teamId, hackathonId]);

    // -- State: Chat --
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [editingMessageId, setEditingMessageId] = useState(null);
    const messagesEndRef = useRef(null);

    // Chat Listeners
    useEffect(() => {
        if (!teamId || !hackathonId) return;
        const unsubscribe = listenToMessages(teamId, hackathonId, (msgs) => {
            setMessages(msgs);
        });
        return () => unsubscribe();
    }, [teamId, hackathonId]);

    // Scroll effect when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !currentUser || !teamId || !hackathonId) return;
        try {
            if (editingMessageId) {
                await editMessage(teamId, hackathonId, editingMessageId, newMessage);
                setEditingMessageId(null);
            } else {
                const name = userData?.username || userData?.name || "User";
                const avatar = userData?.avatar || "";
                await sendMessage(teamId, hackathonId, currentUser.uid, newMessage, name, avatar);
            }
            setNewMessage("");
        } catch (error) {
            console.error("Error saving message:", error);
        }
    };

    const handleCopyMessage = (msg) => {
        navigator.clipboard.writeText(msg).then(() => {
            // Optional: Show a toast or feedback
            console.log("Message copied!");
        });
    };

    const handleStartEdit = (msgId, content) => {
        setEditingMessageId(msgId);
        setNewMessage(content);
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setNewMessage("");
    };

    const handleChatKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        } else if (e.key === 'Escape' && editingMessageId) {
            handleCancelEdit();
        }
    };

    // -- Resize Handlers --
    const startResizing = (e) => {
        e.preventDefault();
        setIsResizing(true);
        resizeStartRef.current = {
            x: e.clientX,
            width: chatWidth
        };
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing || !resizeStartRef.current) return;

            const dx = e.clientX - resizeStartRef.current.x;
            const newWidth = Math.min(Math.max(resizeStartRef.current.width + dx, 320), 800);
            setChatWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            resizeStartRef.current = null;
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, chatWidth]);

    // -- State: Quick Notes --
    const [noteContent, setNoteContent] = useState("");
    const [lastSaved, setLastSaved] = useState(null);
    const noteContentRef = useRef(noteContent);
    const isTypingRef = useRef(false);

    // Load initial note and listen for changes
    useEffect(() => {
        if (!teamId || !hackathonId) return;
        const unsubscribe = listenToQuickNote(teamId, hackathonId, (content) => {
            if (!isTypingRef.current) {
                setNoteContent(content || "");
                noteContentRef.current = content || "";
            }
        });
        return () => unsubscribe();
    }, [teamId, hackathonId]);

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
            if (noteContentRef.current && teamId && hackathonId) {
                console.log("Autosaving note on navigation:", noteContentRef.current);
                updateQuickNote(teamId, hackathonId, noteContentRef.current);
            }
        };
    }, [teamId, hackathonId]);

    const saveNote = async () => {
        if (!teamId || !hackathonId) return;
        try {
            await updateQuickNote(teamId, hackathonId, noteContent);
            setLastSaved(new Date());
        } catch (error) {
            console.error("Failed to save note:", error);
        }
    };

    // -- State: Sprint Tasks --
    const [tasks, setTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");

    // Tasks Listener
    useEffect(() => {
        if (!teamId || !hackathonId) return;
        const unsubscribe = listenToTasks(teamId, hackathonId, (fetchedTasks) => {
            setTasks(fetchedTasks);
        });
        return () => unsubscribe();
    }, [teamId, hackathonId]);

    // -- State: Task Modal --
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTaskCategory, setNewTaskCategory] = useState("General");

    const toggleTask = async (id) => {
        try {
            await toggleTaskComplete(teamId, hackathonId, id);
        } catch (error) {
            console.error("Error toggling task:", error);
        }
    };

    const addTask = () => {
        setNewTaskTitle("");
        setNewTaskCategory("General");
        setIsTaskModalOpen(true);
    };

    const handleAddTaskSubmit = async (e) => {
        e.preventDefault();
        if (newTaskTitle.trim() && teamId && hackathonId) {
            try {
                await firebaseAddTask(teamId, hackathonId, newTaskTitle, newTaskCategory);
                setIsTaskModalOpen(false);
                setNewTaskTitle("");
            } catch (error) {
                console.error("Error adding task:", error);
            }
        }
    };

    const completedCount = tasks.filter(t => t.completed).length;
    const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

    // -- State: Expandable Sections --
    const [expandedSections, setExpandedSections] = useState({
        quickNotes: true,
        teamChat: true,
        sprintTasks: true,
        assets: true
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // -- State: Submission Assets --
    const [assets, setAssets] = useState([]);

    // Assets Listener
    useEffect(() => {
        if (!teamId || !hackathonId) return;
        const unsubscribe = listenToLinks(teamId, hackathonId, (fetchedLinks) => {
            setAssets(fetchedLinks);
        });
        return () => unsubscribe();
    }, [teamId, hackathonId]);

    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [newAssetTitle, setNewAssetTitle] = useState("");
    const [newAssetUrl, setNewAssetUrl] = useState("");

    const addAsset = () => {
        setNewAssetTitle("");
        setNewAssetUrl("");
        setIsAssetModalOpen(true);
    };

    const handleAddAssetSubmit = async (e) => {
        e.preventDefault();
        if (newAssetUrl.trim() && teamId && hackathonId) {
            let type = 'link';
            let icon = 'link';
            let color = 'bg-slate-500';

            const url = newAssetUrl.toLowerCase();
            if (url.includes('github')) { type = 'github'; icon = 'code'; color = 'bg-slate-900'; }
            else if (url.includes('figma')) { type = 'figma'; icon = 'design_services'; color = 'bg-pink-500'; }
            else if (url.includes('youtube') || url.includes('loom')) { type = 'video'; icon = 'video_library'; color = 'bg-red-500'; }

            try {
                await firebaseAddLink(
                    teamId,
                    hackathonId,
                    newAssetTitle.trim() || 'New Asset',
                    newAssetUrl,
                    type,
                    icon,
                    color
                );
                setIsAssetModalOpen(false);
                setNewAssetTitle("");
                setNewAssetUrl("");
            } catch (error) {
                console.error("Error adding asset:", error);
            }
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

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 text-slate-500">
                <span className="material-symbols-outlined animate-spin text-4xl mb-4 text-primary">progress_activity</span>
                <p className="font-bold text-lg">Loading Workspace...</p>
            </div>
        );
    }

    if (!hackathon) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-4 text-red-500">error</span>
                <p className="font-bold text-lg mb-4">Hackathon not found</p>
                <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-primary text-white rounded-lg font-bold">Go to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 h-screen overflow-hidden flex flex-col font-display">
            {/* Global Header */}
            <Header title={hackathon?.name || "Loading Workspace..."} backPath="/dashboard">
            </Header>

            <div className="flex flex-1 w-full max-w-[1600px] mx-auto p-6 overflow-hidden">
                {/* Main Workspace Stack */}
                <main className="flex gap-6 w-full h-full overflow-x-auto pb-2 custom-scrollbar">

                    {/* Quick Notes */}
                    <section className="flex-1 min-w-[280px] h-full rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col bg-white dark:bg-background-dark/50 shrink-0">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => toggleSection('quickNotes')}>
                            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Quick Notes</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className={`flex h-2 w-2 rounded-full ${lastSaved ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                    <span className="text-[10px] font-medium text-slate-400">{lastSaved ? 'SAVED' : 'UNSAVED'}</span>
                                </div>
                                <span className={`material-symbols-outlined text-slate-400 transition-transform ${expandedSections.quickNotes ? 'rotate-180' : ''}`}>
                                    expand_more
                                </span>
                            </div>
                        </div>
                        {expandedSections.quickNotes && (
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
                        )}
                    </section>

                    {/* Team Chat */}
                    <section
                        className={`h-full rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col bg-white dark:bg-background-dark/50 shrink-0 relative transition-[flex-basis] duration-75 ${isResizing ? 'border-primary shadow-primary/10' : ''}`}
                        style={{ flexBasis: `${chatWidth}px` }}
                    >
                        {/* Resize Handle (Right) */}
                        <div
                            onMouseDown={startResizing}
                            className={`absolute right-0 top-0 w-2 h-full cursor-col-resize z-50 group hover:bg-primary/10 transition-colors ${isResizing ? 'bg-primary/20' : ''}`}
                        >
                            <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-12 bg-slate-200 dark:bg-slate-700 group-hover:bg-primary rounded-full transition-colors opacity-40 group-hover:opacity-100"></div>
                        </div>

                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => toggleSection('teamChat')}>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">chat_bubble</span>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Team Chat</h3>
                            </div>
                            <span className={`material-symbols-outlined text-slate-400 transition-transform ${expandedSections.teamChat ? 'rotate-180' : ''}`}>
                                expand_more
                            </span>
                        </div>

                        {expandedSections.teamChat && (
                            <>
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
                                                        {isMe ? (userData?.username ? `@${userData.username}` : 'You') : (msg.userName ? (msg.userName.startsWith('@') ? msg.userName : `@${msg.userName}`) : `User ${msg.userId.substring(0, 4)}`)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                                <div className={`p-3 rounded-xl max-w-[85%] break-words text-sm relative group/msg transition-all ${isMe
                                                    ? 'bg-primary text-white rounded-tr-none shadow-sm'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-200 dark:border-slate-700'
                                                    }`}>
                                                    <div className="whitespace-pre-wrap leading-relaxed">
                                                        {msg.message}
                                                    </div>

                                                    {msg.isEdited && (
                                                        <span className={`text-[9px] mt-1 block opacity-60 italic ${isMe ? 'text-right' : 'text-left'}`}>
                                                            (edited)
                                                        </span>
                                                    )}

                                                    {/* Message Actions */}
                                                    <div className={`absolute -top-7 ${isMe ? 'right-0' : 'left-0'} flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1 shadow-xl opacity-0 translate-y-2 group-hover/msg:opacity-100 group-hover/msg:translate-y-0 transition-all z-10 pointer-events-none group-hover/msg:pointer-events-auto`}>
                                                        {isMe && (
                                                            <button
                                                                onClick={() => handleStartEdit(msg.id, msg.message)}
                                                                className="size-6 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
                                                                title="Edit"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleCopyMessage(msg.message)}
                                                            className="size-6 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors"
                                                            title="Copy"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                <div className="p-4 bg-white/0 dark:bg-black/0 border-t border-slate-200 dark:border-slate-800 shrink-0">
                                    {editingMessageId && (
                                        <div className="mb-2 flex items-center justify-between bg-primary/10 dark:bg-primary/5 rounded-lg p-2 border-l-4 border-primary">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className="material-symbols-outlined text-primary text-sm">edit</span>
                                                <p className="text-xs text-primary font-bold truncate">Editing message</p>
                                            </div>
                                            <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                    )}
                                    <div className="relative">
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={handleChatKeyDown}
                                            className="form-textarea w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-primary focus:border-primary text-sm min-h-[50px] max-h-[120px] py-3 pr-12 pl-4 custom-scrollbar resize-none dark:text-white dark:placeholder-slate-500"
                                            placeholder={editingMessageId ? "Edit your message..." : "Type a message..."}
                                            rows={1}
                                            style={{ height: 'auto', minHeight: '50px' }}
                                        ></textarea>
                                        <button
                                            onClick={handleSendMessage}
                                            className="absolute bottom-2.5 right-2 size-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                {editingMessageId ? 'check' : 'send'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>

                    {/* Sprint Tasks */}
                    <section className="flex-1 min-w-[320px] h-full rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col bg-white dark:bg-background-dark shrink-0">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => toggleSection('sprintTasks')}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Sprint Tasks</h3>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); addTask(); }} className="text-primary hover:text-blue-400 flex items-center gap-1 text-sm font-bold">
                                        <span className="material-symbols-outlined text-sm">add</span> Add
                                    </button>
                                    <span className={`material-symbols-outlined text-slate-400 transition-transform ${expandedSections.sprintTasks ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </div>
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
                        {expandedSections.sprintTasks && (
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
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

                                {/* Nested Assets Section */}
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                                    <div className="flex justify-between items-center mb-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-2 rounded-lg transition-colors" onClick={() => toggleSection('assets')}>
                                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">Submission Assets</h4>
                                        <div className="flex items-center gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); addAsset(); }} className="text-primary hover:text-blue-400 flex items-center gap-1 text-xs font-bold">
                                                <span className="material-symbols-outlined text-xs">add</span> New
                                            </button>
                                            <span className={`material-symbols-outlined text-slate-400 text-sm transition-transform ${expandedSections.assets ? 'rotate-180' : ''}`}>
                                                expand_more
                                            </span>
                                        </div>
                                    </div>
                                    {expandedSections.assets && (
                                        <div className="space-y-3">
                                            {assets.map(asset => (
                                                <div key={asset.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-primary/50 group flex items-center gap-3">
                                                    <div className={`size-8 ${asset.color || 'bg-slate-500'} text-white rounded-lg flex items-center justify-center shrink-0`}>
                                                        <span className="material-symbols-outlined text-sm">{asset.icon || 'link'}</span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{asset.label || asset.title}</h5>
                                                        <a href={asset.url.startsWith('http') ? asset.url : `https://${asset.url}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-primary truncate block">{asset.url}</a>
                                                    </div>
                                                    <a href={asset.url.startsWith('http') ? asset.url : `https://${asset.url}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors">
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
                                    )}
                                </div>
                            </div>
                        )}
                    </section>



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
