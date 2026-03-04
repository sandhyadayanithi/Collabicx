import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { listenToTasks, updateTaskStatus, deleteTask as firebaseDeleteTask, getHackathonDetails, getTeamMembers, updateTaskAssignee } from '../firebase/functions';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function KanbanBoard() {
    const { teamId, hackathonId } = useParams();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [hackathon, setHackathon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUserUid, setCurrentUserUid] = useState(null);

    // Modal state
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskCategory, setNewTaskCategory] = useState("General");
    const [newTaskAssignee, setNewTaskAssignee] = useState("");
    const [initialStatusForNewTask, setInitialStatusForNewTask] = useState("todo");

    // Team Members State
    const [teamMembers, setTeamMembers] = useState([]);

    // Drag Over State
    const [dragOverCol, setDragOverCol] = useState(null);

    // Helper for tag colors
    const getTagStyles = (category) => {
        const cat = (category || 'general').toLowerCase();
        if (cat === 'backend') return { backgroundColor: '#2563eb', color: 'white' };
        if (cat === 'design') return { backgroundColor: '#10b981', color: 'white' };
        if (cat === 'frontend') return { backgroundColor: '#f59e0b', color: 'white' };
        return { backgroundColor: '#64748b', color: 'white' };
    };

    // Fetch hackathon details
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserUid(user.uid);
            } else {
                setCurrentUserUid(null);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (teamId && hackathonId) {
            setLoading(true);
            getHackathonDetails(teamId, hackathonId).then(data => {
                if (data) {
                    setHackathon(data);
                } else {
                    console.error("Hackathon not found");
                }
                setLoading(false);
            }).catch(err => {
                console.error("Error fetching hackathon:", err);
                setLoading(false);
            });
        }
    }, [teamId, hackathonId]);

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

    // Listen to tasks
    useEffect(() => {
        if (!teamId || !hackathonId) return;
        const unsubscribe = listenToTasks(teamId, hackathonId, (fetchedTasks) => {
            setTasks(fetchedTasks);
        });
        return () => unsubscribe();
    }, [teamId, hackathonId]);

    // Drag and Drop Handlers
    const handleDragStart = (e, taskId) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        setDragOverCol(null);
        const taskId = e.dataTransfer.getData("taskId");
        if (!taskId || !teamId || !hackathonId) return;

        try {
            await updateTaskStatus(teamId, hackathonId, taskId, newStatus);
        } catch (error) {
            console.error("Error updating task status:", error);
        }
    };

    const handleDragOver = (e, colId) => {
        e.preventDefault();
        if (dragOverCol !== colId) {
            setDragOverCol(colId);
        }
    };

    const handleDragLeave = (e) => {
        setDragOverCol(null);
    };

    const handleDeleteTask = async (id, e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this task?")) {
            try {
                await firebaseDeleteTask(teamId, hackathonId, id);
            } catch (error) {
                console.error("Error deleting task:", error);
            }
        }
    };

    const handleAssigneeChange = async (taskId, memberId) => {
        if (!isCreator) return;
        try {
            const member = teamMembers.find(m => m.user?.uid === memberId);
            const username = member ? (member.user?.username || member.user?.name || "User") : null;
            await updateTaskAssignee(teamId, hackathonId, taskId, memberId === "" ? null : memberId, memberId === "" ? null : username);
        } catch (error) {
            console.error("Error updating assignee", error);
        }
    };

    const isCreator = teamMembers.some(m => m.userId === currentUserUid && m.role === 'owner');

    // Group tasks for Kanban board
    const kanbanTasks = {
        todo: tasks.filter(t => !t.completed && t.status !== "inProgress" && t.status !== "done"),
        inProgress: tasks.filter(t => t.status === "inProgress"),
        done: tasks.filter(t => t.completed || t.status === "done")
    };

    const handleAddTaskClick = (status) => {
        setInitialStatusForNewTask(status);
        setNewTaskTitle("");
        setNewTaskCategory("General");
        setNewTaskAssignee(""); // Reset assignee selection
        setIsTaskModalOpen(true);
    };

    const handleAddTaskSubmit = async (e) => {
        e.preventDefault();
        if (newTaskTitle.trim() && teamId && hackathonId) {
            try {
                // Find selected assignee details
                let assigneeId = null;
                let assigneeUsername = null;
                if (newTaskAssignee !== "") {
                    assigneeId = newTaskAssignee;
                    const member = teamMembers.find(m => m.user?.uid === assigneeId);
                    if (member) {
                        assigneeUsername = member.user?.username || member.user?.name || "User";
                    }
                }

                // Add the task, passing assignee information
                const { addTask } = await import('../firebase/functions');
                await addTask(teamId, hackathonId, newTaskTitle, newTaskCategory, assigneeId, assigneeUsername);

                // Fetch the newly added task to update its status
                // Alternatively we just update the addTask function to handle status, but for now this is safe
                // Wait a tiny bit for listener to catch it, or just rely on backend changes
                setIsTaskModalOpen(false);
                setNewTaskTitle("");
            } catch (error) {
                console.error("Error adding task:", error);
            }
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background-light dark:bg-background-dark text-slate-500">
                <span className="material-symbols-outlined animate-spin text-4xl mb-4 text-primary">progress_activity</span>
                <p className="font-bold text-lg">Loading Board...</p>
            </div>
        );
    }

    if (!hackathon) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background-light dark:bg-background-dark text-slate-500">
                <span className="material-symbols-outlined text-4xl mb-4 text-red-500">error</span>
                <p className="font-bold text-lg mb-4">Workspace not found</p>
                <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-primary text-white rounded-lg font-bold">Go to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 h-screen overflow-hidden flex flex-col font-display">
            {/* Header linking back to the Workspace */}
            <Header
                title={`${hackathon?.name || "Workspace"} - Kanban Board`}
                backPath={`/workspace/${teamId}/${hackathonId}`}
                ideaContent={null}
            />

            <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-text-primary">Sprint Tasks Board</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Drag and drop tasks to move them across stages.</p>
                    </div>
                    <button
                        onClick={() => navigate(`/workspace/${teamId}/${hackathonId}`)}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Back to Workspace
                    </button>
                </div>

                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* To Do Column */}
                    <div
                        className="flex-1 rounded-[16px] p-5 flex flex-col transition-shadow"
                        style={{
                            background: 'rgba(10, 20, 30, 0.75)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: dragOverCol === 'todo' ? 'inset 0 0 0 2px rgba(59,130,246,0.4), 0 10px 40px rgba(0,0,0,0.35)' : '0 10px 40px rgba(0,0,0,0.35)'
                        }}
                        onDrop={(e) => handleDrop(e, 'todo')}
                        onDragOver={(e) => handleDragOver(e, 'todo')}
                        onDragLeave={handleDragLeave}
                    >
                        <div className="flex items-center justify-between mb-5 px-1">
                            <h4 className="font-[600] flex items-center gap-2 text-lg" style={{ color: '#e6edf3' }}>
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#94a3b8' }}></div>
                                To Do
                            </h4>
                            <span className="text-[12px] font-bold text-white px-[10px] py-[4px] rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                {kanbanTasks.todo.length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                            {kanbanTasks.todo.map(task => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    className="p-4 cursor-grab active:cursor-grabbing transition-all duration-200 group relative hover:bg-[#273447] hover:-translate-y-[2px]"
                                    style={{
                                        background: '#1f2a38',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '12px',
                                        boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
                                    }}
                                >
                                    <p className="text-[15px] font-medium mb-3 leading-snug" style={{ color: '#e6edf3' }}>{task.title}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[12px] font-semibold px-[10px] py-[4px] rounded-full" style={getTagStyles(task.category)}>
                                            {task.category || 'General'}
                                        </span>
                                        <div className="flex z-10 items-center justify-end">
                                            <div className="flex bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-transparent transition-colors px-1" onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    value={task.assigneeId || ""}
                                                    onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                                                    disabled={!isCreator}
                                                    title={!isCreator ? "Only team creators can assign tasks" : "Assign Task"}
                                                    className={`bg-transparent text-[10px] font-bold outline-none text-slate-300 p-1 rounded-md max-w-[85px] ${!isCreator ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {teamMembers.map(member => (
                                                        <option key={member.id} value={member.user?.uid}>
                                                            {member.user?.username || member.user?.name || "User"}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteTask(task.id, e)}
                                                className="opacity-0 group-hover:opacity-100 size-7 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all ml-1"
                                                title="Delete Task"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {kanbanTasks.todo.length === 0 && (
                                <div
                                    className="flex items-center justify-center cursor-pointer group py-8"
                                    onClick={() => handleAddTaskClick('todo')}
                                >
                                    <p className="text-sm font-medium text-center w-full mx-auto transition-colors group-hover:bg-[rgba(255,255,255,0.06)]"
                                        style={{
                                            border: '2px dashed rgba(255,255,255,0.15)',
                                            borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.03)',
                                            color: '#94a3b8',
                                            padding: '24px'
                                        }}>
                                        Click to add a task, or drop one here
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* In Progress Column */}
                    <div
                        className="flex-1 rounded-[16px] p-5 flex flex-col transition-shadow"
                        style={{
                            background: 'rgba(4, 50, 96, 0.75)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: dragOverCol === 'inProgress' ? 'inset 0 0 0 2px rgba(59,130,246,0.4), 0 10px 40px rgba(0,0,0,0.35)' : '0 10px 40px rgba(0,0,0,0.35)'
                        }}
                        onDrop={(e) => handleDrop(e, 'inProgress')}
                        onDragOver={(e) => handleDragOver(e, 'inProgress')}
                        onDragLeave={handleDragLeave}
                    >
                        <div className="flex items-center justify-between mb-5 px-1">
                            <h4 className="font-[600] flex items-center gap-2 text-lg" style={{ color: '#e6edf3' }}>
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                                In Progress
                            </h4>
                            <span className="text-[12px] font-bold text-white px-[10px] py-[4px] rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                {kanbanTasks.inProgress.length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                            {kanbanTasks.inProgress.map(task => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    className="p-4 cursor-grab active:cursor-grabbing transition-all duration-200 group relative hover:bg-[#273447] hover:-translate-y-[2px]"
                                    style={{
                                        background: '#1f2a38',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '12px',
                                        boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
                                    }}
                                >
                                    <p className="text-[15px] font-medium mb-3 leading-snug" style={{ color: '#e6edf3' }}>{task.title}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[12px] font-semibold px-[10px] py-[4px] rounded-full" style={getTagStyles(task.category)}>
                                            {task.category || 'General'}
                                        </span>
                                        <div className="flex z-10 items-center justify-end">
                                            <div className="flex bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-transparent transition-colors px-1" onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    value={task.assigneeId || ""}
                                                    onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                                                    disabled={!isCreator}
                                                    title={!isCreator ? "Only team creators can assign tasks" : "Assign Task"}
                                                    className={`bg-transparent text-[10px] font-bold outline-none text-slate-300 p-1 rounded-md max-w-[85px] ${!isCreator ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {teamMembers.map(member => (
                                                        <option key={member.id} value={member.user?.uid}>
                                                            {member.user?.username || member.user?.name || "User"}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteTask(task.id, e)}
                                                className="opacity-0 group-hover:opacity-100 size-7 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all ml-1"
                                                title="Delete Task"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {kanbanTasks.inProgress.length === 0 && (
                                <div
                                    className="flex items-center justify-center cursor-pointer group py-8"
                                    onClick={() => handleAddTaskClick('inProgress')}
                                >
                                    <p className="text-sm font-medium text-center w-full mx-auto transition-colors group-hover:bg-[rgba(255,255,255,0.06)]"
                                        style={{
                                            border: '2px dashed rgba(255,255,255,0.15)',
                                            borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.03)',
                                            color: '#94a3b8',
                                            padding: '24px'
                                        }}>
                                        Click to add a task, or drop one here
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Done Column */}
                    <div
                        className="flex-1 rounded-[16px] p-5 flex flex-col transition-shadow"
                        style={{
                            background: 'rgba(3, 85, 48, 0.75)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: dragOverCol === 'done' ? 'inset 0 0 0 2px rgba(59,130,246,0.4), 0 10px 40px rgba(0,0,0,0.35)' : '0 10px 40px rgba(0,0,0,0.35)'
                        }}
                        onDrop={(e) => handleDrop(e, 'done')}
                        onDragOver={(e) => handleDragOver(e, 'done')}
                        onDragLeave={handleDragLeave}
                    >
                        <div className="flex items-center justify-between mb-5 px-1">
                            <h4 className="font-[600] flex items-center gap-2 text-lg" style={{ color: '#e6edf3' }}>
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
                                Done
                            </h4>
                            <span className="text-[12px] font-bold text-white px-[10px] py-[4px] rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                {kanbanTasks.done.length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                            {kanbanTasks.done.map(task => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    className="p-4 cursor-grab active:cursor-grabbing transition-all duration-200 group relative hover:bg-[#273447] hover:-translate-y-[2px] opacity-70 hover:opacity-100"
                                    style={{
                                        background: '#1f2a38',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: '12px',
                                        boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
                                    }}
                                >
                                    <p className="text-[15px] font-medium mb-3 leading-snug line-through" style={{ color: '#94a3b8' }}>{task.title}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[12px] font-semibold px-[10px] py-[4px] rounded-full" style={getTagStyles(task.category)}>
                                            {task.category || 'General'}
                                        </span>
                                        <div className="flex z-10 items-center justify-end">
                                            <div className="flex bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-transparent transition-colors px-1" onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    value={task.assigneeId || ""}
                                                    onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                                                    disabled={!isCreator}
                                                    title={!isCreator ? "Only team creators can assign tasks" : "Assign Task"}
                                                    className={`bg-transparent text-[10px] font-bold outline-none text-slate-400 p-1 rounded-md max-w-[85px] ${!isCreator ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                                                >
                                                    <option value="">Unassigned</option>
                                                    {teamMembers.map(member => (
                                                        <option key={member.id} value={member.user?.uid}>
                                                            {member.user?.username || member.user?.name || "User"}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteTask(task.id, e)}
                                                className="opacity-0 group-hover:opacity-100 size-7 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all ml-1"
                                                title="Delete Task"
                                            >
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {kanbanTasks.done.length === 0 && (
                                <div
                                    className="flex items-center justify-center cursor-pointer group py-8"
                                    onClick={() => handleAddTaskClick('done')}
                                >
                                    <p className="text-sm font-medium text-center w-full mx-auto transition-colors group-hover:bg-[rgba(255,255,255,0.06)]"
                                        style={{
                                            border: '2px dashed rgba(255,255,255,0.15)',
                                            borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.03)',
                                            color: '#94a3b8',
                                            padding: '24px'
                                        }}>
                                        Click to add a task, or drop one here
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* AI Modal Equivalent (Task Add Modal) */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-text-primary">Add New Sprint Task</h3>
                            <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleAddTaskSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Task Title <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="e.g., Design database schema"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-text-primary placeholder:text-slate-400"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                <select
                                    value={newTaskCategory}
                                    onChange={(e) => setNewTaskCategory(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-text-primary"
                                >
                                    <option value="General">General</option>
                                    <option value="Frontend">Frontend</option>
                                    <option value="Backend">Backend</option>
                                    <option value="Design">Design</option>
                                    <option value="Documentation">Documentation</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Assign To</label>
                                <select
                                                    value={newTaskAssignee}
                                                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                                                    disabled={!isCreator}
                                                    title={!isCreator ? "Only team creators can assign tasks" : "Assign Task"}
                                                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-text-primary ${!isCreator ? "cursor-not-allowed opacity-50" : ""}`}
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
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newTaskTitle.trim()}
                                    className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-sm">add_task</span>
                                    Add Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
