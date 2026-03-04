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
    updateTaskStatus,
    addTask as firebaseAddTask,
    addLink as firebaseAddLink,
    deleteLink,
    getHackathonDetails,
    getTeamMembers,
    editMessage,
    updateHackathon,
    deleteTask as firebaseDeleteTask
} from '../firebase/functions';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { generateTasksFromIdea } from '../services/gemini';


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
                if (snap.exists()) {
                    const data = snap.data();
                    setUserData(data);
                    if (!(data.profession || data.usageRole || data.username)) {
                        navigate('/profile-setup');
                    }
                }
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

    // -- State: Team Members --
    const [teamMembers, setTeamMembers] = useState([]);

    // Fetch team members
    useEffect(() => {
        if (teamId) {
            getTeamMembers(teamId).then(members => {
                setTeamMembers(members);
            }).catch(err => {
                console.error("Error fetching team members:", err);
            });
        }
    }, [teamId]);

    // Scroll effect when messages change

    useEffect(() => {
        if (messages.length > 0) {
            const scroll = () => {
                messagesEndRef.current?.scrollIntoView({
                    behavior: "auto",
                    block: "end"
                });
            };

            // Immediate scroll
            scroll();

            // Multiple retries to ensure we stay at the bottom after dynamic content/images load
            const t1 = setTimeout(scroll, 50);
            const t2 = setTimeout(scroll, 150);
            const t3 = setTimeout(scroll, 300);
            const t4 = setTimeout(scroll, 600); // Late retry for safety

            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
                clearTimeout(t4);
            };
        }
    }, [messages]);

    const handleSendMessage = async () => {
        const messageToSend = newMessage.trim();
        if (!messageToSend || !currentUser || !teamId || !hackathonId) return;

        // Clear input immediately for better UX
        setNewMessage("");

        try {
            if (editingMessageId) {
                const mid = editingMessageId;
                setEditingMessageId(null);
                await editMessage(teamId, hackathonId, mid, messageToSend);
            } else {
                const name = userData?.username || userData?.name || "User";
                const avatar = userData?.avatar || "";
                await sendMessage(teamId, hackathonId, currentUser.uid, messageToSend, name, avatar);
            }
        } catch (error) {
            console.error("Error saving message:", error);
            // If it failed, we could potentially put the text back, but usually, 
            // clearing immediately is expected for chat apps.
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
    const lastSavedContentRef = useRef("");
    const isTypingRef = useRef(false);

    // Load initial note and listen for changes
    useEffect(() => {
        if (!teamId || !hackathonId) return;
        const unsubscribe = listenToQuickNote(teamId, hackathonId, (content) => {
            if (!isTypingRef.current) {
                const nextContent = content || "";
                setNoteContent(nextContent);
                noteContentRef.current = nextContent;
                lastSavedContentRef.current = nextContent;
                setLastSaved(nextContent ? new Date() : null);
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

    const saveNote = async () => {
        if (!teamId || !hackathonId) return;
        if (noteContent === lastSavedContentRef.current) return;
        try {
            await updateQuickNote(teamId, hackathonId, noteContent);
            lastSavedContentRef.current = noteContent;
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
    const [newTaskAssignee, setNewTaskAssignee] = useState("");
    const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
    const [isIdeaPromptOpen, setIsIdeaPromptOpen] = useState(false);
    const [projectIdeaInput, setProjectIdeaInput] = useState("");
    const [isEditIdeaModalOpen, setIsEditIdeaModalOpen] = useState(false);
    const [editIdeaInput, setEditIdeaInput] = useState("");

    const handleGenerateTasks = async (ideaToUse) => {
        setIsIdeaPromptOpen(false);
        if (!ideaToUse || !teamId || !hackathonId) return;

        setIsGeneratingTasks(true);
        try {
            // Check if we need to update the hackathon idea
            if (ideaToUse !== hackathon?.theme) {
                await updateHackathon(teamId, hackathonId, { theme: ideaToUse });
                // Optimistically update local state
                setHackathon(prev => ({ ...prev, theme: ideaToUse }));
            }

            const newTasks = await generateTasksFromIdea(ideaToUse);
            for (const task of newTasks) {
                await firebaseAddTask(teamId, hackathonId, task.title, task.category || "General");
            }
        } catch (error) {
            console.error("Failed to generate tasks:", error);
            alert("Failed to generate tasks using AI. Please ensure your Gemini API key is configured correctly.");
        } finally {
            setIsGeneratingTasks(false);
            setProjectIdeaInput("");
        }
    };

    const handleAITaskButtonClick = () => {
        if (hackathon?.theme) {
            handleGenerateTasks(hackathon.theme);
        } else {
            setProjectIdeaInput("");
            setIsIdeaPromptOpen(true);
        }
    };

    const openEditIdeaModal = () => {
        setEditIdeaInput(hackathon?.theme || "");
        setIsEditIdeaModalOpen(true);
    };

    const handleSaveIdea = async () => {
        if (!teamId || !hackathonId) return;
        try {
            await updateHackathon(teamId, hackathonId, { theme: editIdeaInput });
            setHackathon(prev => ({ ...prev, theme: editIdeaInput }));
            setIsEditIdeaModalOpen(false);
        } catch (error) {
            console.error("Failed to update idea:", error);
            alert("Failed to update project idea.");
        }
    };

    const toggleTask = async (id) => {
        try {
            await toggleTaskComplete(teamId, hackathonId, id);
        } catch (error) {
            console.error("Error toggling task:", error);
        }
    };

    const handleDeleteTask = async (id, e) => {
        e.stopPropagation(); // prevent toggling the task
        if (window.confirm("Are you sure you want to delete this task?")) {
            try {
                await firebaseDeleteTask(teamId, hackathonId, id);
            } catch (error) {
                console.error("Error deleting task:", error);
            }
        }
    };

    const addTask = () => {
        setNewTaskTitle("");
        setNewTaskCategory("General");
        setNewTaskAssignee("");
        setIsTaskModalOpen(true);
    };

    const handleAddTaskSubmit = async (e) => {
        e.preventDefault();
        if (newTaskTitle.trim() && teamId && hackathonId) {
            try {
                let assigneeId = null;
                let assigneeUsername = null;
                if (newTaskAssignee !== "") {
                    assigneeId = newTaskAssignee;
                    const member = teamMembers.find(m => m.user?.uid === assigneeId);
                    if (member) {
                        assigneeUsername = member.user?.username || member.user?.name || "User";
                    }
                }

                await firebaseAddTask(teamId, hackathonId, newTaskTitle, newTaskCategory, assigneeId, assigneeUsername);
                setIsTaskModalOpen(false);
                setNewTaskTitle("");
            } catch (error) {
                console.error("Error adding task:", error);
            }
        }
    };

    const completedCount = tasks.filter(t => t.completed || t.status === "done").length;
    const progress = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

    // No longer required since drag handles have been moved to Kanban board


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

    const handleRemoveAsset = async (assetId) => {
        if (window.confirm("Are you sure you want to remove this asset?")) {
            try {
                await deleteLink(teamId, hackathonId, assetId);
            } catch (error) {
                console.error("Error removing asset:", error);
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
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background-light dark:bg-background-dark text-slate-500">
                <span className="material-symbols-outlined animate-spin text-4xl mb-4 text-primary">progress_activity</span>
                <p className="font-bold text-lg">Loading Workspace...</p>
            </div>
        );
    }

    if (!hackathon) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background-light dark:bg-background-dark text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-4 text-red-500">error</span>
                <p className="font-bold text-lg mb-4">Hackathon not found</p>
                <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-primary text-white rounded-lg font-bold">Go to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 h-screen overflow-hidden flex flex-col font-display">
            {/* Global Header */}
            <Header
                title={hackathon?.name || "Loading Workspace..."}
                backPath={teamId ? `/dashboard/${teamId}` : "/dashboard"}
                ideaContent={hackathon?.theme || null}
                onAddIdea={openEditIdeaModal}
            >
            </Header>

            <div className="flex flex-1 w-full max-w-[1600px] mx-auto p-6 overflow-hidden">
                {/* Main Workspace Stack */}
                <main className="flex gap-6 w-full h-full overflow-x-auto pb-2 custom-scrollbar">

                    {/* Quick Notes */}
                    <section className="flex-1 min-w-[280px] h-full rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col vibrant-card shrink-0">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center transition-colors">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-text-secondary dark:text-emerald-400">Quick Notes</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className={`flex h-2 w-2 rounded-full ${lastSaved ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                    <span className="text-[10px] font-black text-slate-500">{lastSaved ? 'SAVED' : 'UNSAVED'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="flex flex-col h-full">
                                <div className="flex-1 rounded-lg vibrant-badge p-4">
                                    <textarea
                                        value={noteContent}
                                        onChange={handleNoteChange}
                                        className="w-full h-full resize-none bg-transparent border-none focus:ring-0 text-text-primary dark:text-slate-100 placeholder:text-slate-400 font-mono text-sm leading-relaxed"
                                        placeholder="Start typing ideas..."
                                    ></textarea>
                                </div>
                                <div className="mt-2 flex justify-end">
                                    <button
                                        onClick={saveNote}
                                        disabled={noteContent === lastSavedContentRef.current}
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

                    {/* Team Chat */}
                    <section
                        className={`h-full rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col vibrant-card shrink-0 relative transition-[flex-basis] duration-75 ${isResizing ? 'border-primary shadow-primary/10' : ''}`}
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
                                <h3 className="text-sm font-bold text-text-primary">Team Chat</h3>
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
                                        <span className="text-[10px] text-slate-400 dark:text-slate-300 font-bold uppercase">Today</span>
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
                                                    <span className="text-xs font-bold text-text-primary">
                                                        {isMe ? (userData?.username ? `@${userData.username}` : 'You') : (msg.userName ? (msg.userName.startsWith('@') ? msg.userName : `@${msg.userName}`) : `User ${msg.userId.substring(0, 4)}`)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-300">
                                                        {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                                <div className={`p-3 rounded-xl max-w-[85%] break-words text-sm relative group/msg transition-all ${isMe
                                                    ? 'bg-primary text-white rounded-tr-none shadow-sm'
                                                    : 'vibrant-badge text-text-secondary dark:text-slate-300 rounded-tl-none'
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
                                                    <div className={`absolute -top-7 ${isMe ? 'right-0' : 'left-0'} flex items-center gap-1 vibrant-badge rounded-lg p-1 shadow-xl opacity-0 translate-y-2 group-hover/msg:opacity-100 group-hover/msg:translate-y-0 transition-all z-10 pointer-events-none group-hover/msg:pointer-events-auto`}>
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
                                            className="form-textarea w-full rounded-xl vibrant-badge focus:ring-primary focus:border-primary text-sm min-h-[50px] max-h-[120px] py-3 pr-12 pl-4 custom-scrollbar resize-none text-vibrant-primary dark:placeholder-slate-500"
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

                    {/* Sprint Tasks & Submission Assets combined */}
                    <section className="flex-1 min-w-[320px] h-full rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col vibrant-card shrink-0">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => toggleSection('sprintTasks')}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-text-secondary dark:text-emerald-400">Sprint Tasks</h3>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); navigate(`/workspace/${teamId}/${hackathonId}/board`); }} className="text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1 text-sm font-bold mr-2">
                                        <span className="material-symbols-outlined text-sm">view_kanban</span>
                                        Kanban
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleAITaskButtonClick(); }} disabled={isGeneratingTasks} className="text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1 text-sm font-bold mr-2 disabled:opacity-50">
                                        {isGeneratingTasks ? (
                                            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                        )}
                                        {isGeneratingTasks ? 'Generating...' : 'AI Tasks'}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); addTask(); }} className="text-primary hover:text-blue-400 flex items-center gap-1 text-sm font-bold">
                                        <span className="material-symbols-outlined text-sm">add</span> Add
                                    </button>
                                    <span className={`material-symbols-outlined text-slate-400 transition-transform ${expandedSections.sprintTasks ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </div>
                            </div>
                            <div className="vibrant-badge p-4 rounded-xl">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <p className="text-2xl font-black text-text-primary">{progress}%</p>
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
                            {/* Task List */}
                            {expandedSections.sprintTasks && (
                                <div className="space-y-2 mb-8">
                                    {tasks.map(task => (
                                        <div key={task.id} className={`flex items-center gap-3 p-3 vibrant-badge rounded-lg group transition-all ${task.completed ? 'opacity-60' : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => toggleTask(task.id)}
                                                className="rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary bg-transparent size-4 cursor-pointer shrink-0"
                                            />
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <p className={`text-sm text-text-primary font-black truncate w-full ${task.completed ? 'line-through text-slate-500' : ''}`}>
                                                    {task.title}
                                                </p>
                                                {task.assigneeUsername && (
                                                    <div className="mt-1 flex items-center gap-1 opacity-70">
                                                        <span className="material-symbols-outlined text-[12px] text-slate-500">person</span>
                                                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                                                            {task.assigneeUsername}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteTask(task.id, e)}
                                                className="hidden group-hover:flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                                                title="Delete Task"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                    {tasks.length === 0 && (
                                        <p className="text-center text-slate-400 text-sm py-8 italic">No tasks.</p>
                                    )}
                                </div>
                            )}

                            {/* Submission Assets Header & List */}
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                                <div className="flex justify-between items-center mb-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 p-2 rounded-lg transition-colors" onClick={() => toggleSection('assets')}>
                                    <h4 className="font-bold text-sm uppercase tracking-wider text-text-secondary dark:text-emerald-400">Submission Assets</h4>
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); addAsset(); }} className="text-primary hover:text-blue-400 flex items-center gap-1 text-xs font-bold">
                                            <span className="material-symbols-outlined text-sm">add</span> New
                                        </button>
                                        <span className={`material-symbols-outlined text-slate-400 text-sm transition-transform ${expandedSections.assets ? 'rotate-180' : ''}`}>
                                            expand_more
                                        </span>
                                    </div>
                                </div>

                                {expandedSections.assets && (
                                    <div className="space-y-3">
                                        {assets.map(asset => (
                                            <div key={asset.id} className="vibrant-badge p-3 rounded-xl shadow-sm transition-all hover:border-primary/50 group flex items-center gap-3">
                                                <div className={`size-8 ${asset.color || 'bg-slate-500'} text-white rounded-lg flex items-center justify-center shrink-0`}>
                                                    <span className="material-symbols-outlined text-sm">{asset.icon || 'link'}</span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{asset.label || asset.title}</h5>
                                                    <a href={asset.url.startsWith('http') ? asset.url : `https://${asset.url}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-600 dark:text-slate-400 font-bold hover:text-primary truncate block">{asset.url}</a>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <a href={asset.url.startsWith('http') ? asset.url : `https://${asset.url}`} target="_blank" rel="noopener noreferrer" className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors" title="Open Link">
                                                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                                                    </a>
                                                    <button
                                                        onClick={() => handleRemoveAsset(asset.id)}
                                                        className="size-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                                                        title="Remove Asset"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {assets.length === 0 && (
                                            <button onClick={addAsset} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                                <span className="material-symbols-outlined">add_link</span>
                                                Add Asset
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
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
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Assign To</label>
                                        <select
                                            value={newTaskAssignee}
                                            onChange={(e) => setNewTaskAssignee(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 dark:text-white"
                                        >
                                            <option value="">Unassigned</option>
                                            {teamMembers.map(member => (
                                                <option key={member.id} value={member.user?.uid}>
                                                    {member.user?.username || member.user?.name || "User"}
                                                </option>
                                            ))}
                                        </select>
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

            {/* AI Idea Prompt Modal */}
            {
                isIdeaPromptOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Task Suggestions</h3>
                                    </div>
                                    <button onClick={() => setIsIdeaPromptOpen(false)} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        To generate tasks, the AI needs to know what you are building. Please enter your project idea or theme below.
                                    </p>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Project Idea</label>
                                        <textarea
                                            value={projectIdeaInput}
                                            onChange={(e) => setProjectIdeaInput(e.target.value)}
                                            placeholder="e.g., An AI planner that helps generate sprint tasks for hackathons..."
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm font-medium text-slate-900 dark:text-white min-h-[100px] resize-none"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsIdeaPromptOpen(false)}
                                            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleGenerateTasks(projectIdeaInput)}
                                            disabled={!projectIdeaInput.trim()}
                                            className="flex-1 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Generate Tasks
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Project Idea Modal */}
            {
                isEditIdeaModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 text-primary">
                                        <span className="material-symbols-outlined">lightbulb</span>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Project Idea</h3>
                                    </div>
                                    <button onClick={() => setIsEditIdeaModalOpen(false)} className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Update your project idea or theme below. This will not regenerate your tasks.
                                    </p>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Project Idea</label>
                                        <textarea
                                            value={editIdeaInput}
                                            onChange={(e) => setEditIdeaInput(e.target.value)}
                                            placeholder="e.g., An AI planner that helps generate sprint tasks for hackathons..."
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-900 dark:text-white min-h-[150px] resize-none"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditIdeaModalOpen(false)}
                                            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveIdea}
                                            className="flex-1 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                        >
                                            Save Idea
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
