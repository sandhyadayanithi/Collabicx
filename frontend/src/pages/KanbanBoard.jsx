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
        const taskId = e.dataTransfer.getData("taskId");
        if (!taskId || !teamId || !hackathonId) return;

        try {
            await updateTaskStatus(teamId, hackathonId, taskId, newStatus);
        } catch (error) {
            console.error("Error updating task status:", error);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
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
                        className="flex-1 bg-slate-100 dark:bg-slate-800/30 rounded-3xl p-5 flex flex-col border border-slate-200 dark:border-slate-800/60 shadow-inner"
                        onDrop={(e) => handleDrop(e, 'todo')}
                        onDragOver={handleDragOver}
                    >
                        <div className="flex items-center justify-between mb-5 px-1">
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-lg">
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                                To Do
                            </h4>
                            <span className="text-xs font-bold text-slate-600 bg-slate-200/80 dark:bg-slate-700 px-2.5 py-1 rounded-full">
                                {kanbanTasks.todo.length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                            {kanbanTasks.todo.map(task => (
                                <div 
                                    key={task.id} 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:border-black/20 dark:hover:border-white/20 transition-all group relative hover:-translate-y-0.5"
                                >
                                    <p className="text-[15px] text-slate-800 dark:text-slate-100 font-medium mb-3 leading-snug">{task.title}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] uppercase tracking-wide font-black text-slate-500 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-md">
                                            {task.category || 'General'}
                                        </span>
                                        <div className="flex z-10 items-center justify-end">
                                            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg hover:border-primary/50 border border-transparent transition-colors px-1" onClick={(e) => e.stopPropagation()}>
                                                <select 
                                                    value={task.assigneeId || ""}
                                                    onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                                                    disabled={!isCreator}
                                                    title={!isCreator ? "Only team creators can assign tasks" : "Assign Task"}
                                                    className={`bg-transparent text-[10px] font-bold outline-none text-slate-500 dark:text-slate-400 p-1 rounded-md max-w-[85px] ${!isCreator ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
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
                                                className="opacity-0 group-hover:opacity-100 size-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all ml-1"
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
                                    className="h-full flex items-center justify-center pb-10 cursor-pointer group"
                                    onClick={() => handleAddTaskClick('todo')}
                                >
                                    <p className="text-slate-400 text-sm font-medium text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 w-full max-w-[80%] mx-auto group-hover:bg-slate-200/50 dark:group-hover:bg-slate-700/50 transition-colors">
                                        Click to add a task, or drop one here
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* In Progress Column */}
                    <div 
                        className="flex-1 bg-blue-50/60 dark:bg-blue-900/10 rounded-3xl p-5 flex flex-col border border-blue-100 dark:border-blue-900/30 shadow-inner"
                        onDrop={(e) => handleDrop(e, 'inProgress')}
                        onDragOver={handleDragOver}
                    >
                        <div className="flex items-center justify-between mb-5 px-1">
                            <h4 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2 text-lg">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                In Progress
                            </h4>
                            <span className="text-xs font-bold text-blue-600 bg-blue-100/80 dark:bg-blue-900/40 px-2.5 py-1 rounded-full">
                                {kanbanTasks.inProgress.length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                            {kanbanTasks.inProgress.map(task => (
                                <div 
                                    key={task.id} 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-md border-l-4 border-l-blue-500 border-y border-r border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all group relative hover:-translate-y-0.5"
                                >
                                    <p className="text-[15px] text-slate-800 dark:text-slate-100 font-medium mb-3 leading-snug">{task.title}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] uppercase tracking-wide font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-900/50 px-2.5 py-1 rounded-md">
                                            {task.category || 'General'}
                                        </span>
                                        <div className="flex z-10 items-center justify-end">
                                            <div className="flex bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 border border-transparent transition-colors px-1" onClick={(e) => e.stopPropagation()}>
                                                <select 
                                                    value={task.assigneeId || ""}
                                                    onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                                                    disabled={!isCreator}
                                                    title={!isCreator ? "Only team creators can assign tasks" : "Assign Task"}
                                                    className={`bg-transparent text-[10px] font-bold outline-none text-blue-600 dark:text-blue-400 p-1 rounded-md max-w-[85px] ${!isCreator ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
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
                                                className="opacity-0 group-hover:opacity-100 size-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all ml-1"
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
                                    className="h-full flex items-center justify-center pb-10 cursor-pointer group"
                                    onClick={() => handleAddTaskClick('inProgress')}    
                                >
                                    <p className="text-blue-400/80 dark:text-blue-800 text-sm font-medium text-center border-2 border-dashed border-blue-300 dark:border-blue-900/50 rounded-2xl p-6 w-full max-w-[80%] mx-auto group-hover:bg-blue-100/50 dark:group-hover:bg-blue-900/40 transition-colors">
                                        Click to add a task, or drop one here
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Done Column */}
                    <div 
                        className="flex-1 bg-green-50/60 dark:bg-green-900/10 rounded-3xl p-5 flex flex-col border border-green-100 dark:border-green-900/30 shadow-inner"
                        onDrop={(e) => handleDrop(e, 'done')}
                        onDragOver={handleDragOver}
                    >
                        <div className="flex items-center justify-between mb-5 px-1">
                            <h4 className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2 text-lg">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                Done
                            </h4>
                            <span className="text-xs font-bold text-green-600 bg-green-100/80 dark:bg-green-900/40 px-2.5 py-1 rounded-full">
                                {kanbanTasks.done.length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                            {kanbanTasks.done.map(task => (
                                <div 
                                    key={task.id} 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    className="bg-white/70 dark:bg-slate-800/70 p-4 rounded-2xl shadow-sm border border-green-200 dark:border-green-900/50 cursor-grab active:cursor-grabbing hover:bg-white dark:hover:bg-slate-800 transition-all group relative opacity-80 hover:opacity-100 hover:-translate-y-0.5"
                                >
                                    <p className="text-[15px] text-slate-500 dark:text-slate-400 font-medium mb-3 leading-snug line-through">{task.title}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] uppercase tracking-wide font-black text-green-700 bg-green-100 dark:bg-green-900/50 border border-green-200 dark:border-green-900/60 px-2.5 py-1 rounded-md">
                                            {task.category || 'General'}
                                        </span>
                                        <div className="flex z-10 items-center justify-end">
                                            <div className="flex bg-green-100 dark:bg-green-900/40 rounded-lg hover:border-green-300 dark:hover:border-green-600 border border-transparent transition-colors px-1" onClick={(e) => e.stopPropagation()}>
                                                <select 
                                                    value={task.assigneeId || ""}
                                                    onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                                                    disabled={!isCreator}
                                                    title={!isCreator ? "Only team creators can assign tasks" : "Assign Task"}
                                                    className={`bg-transparent text-[10px] font-bold outline-none text-green-700 dark:text-green-400 p-1 rounded-md max-w-[85px] ${!isCreator ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
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
                                                className="opacity-0 group-hover:opacity-100 size-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all ml-1"
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
                                    className="h-full flex items-center justify-center pb-10 cursor-pointer group"
                                    onClick={() => handleAddTaskClick('done')}    
                                >
                                    <p className="text-green-400/80 dark:text-green-800 text-sm font-medium text-center border-2 border-dashed border-green-300 dark:border-green-900/50 rounded-2xl p-6 w-full max-w-[80%] mx-auto group-hover:bg-green-100/50 dark:group-hover:bg-green-900/40 transition-colors">
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
