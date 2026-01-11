import React from 'react';

export default function TaskItem({ title, assignee, priority, done }) {
    const priorityColors = {
        High: "bg-primary/10 text-primary",
        Medium: "bg-amber-500/10 text-amber-500"
    };

    return (
        <div className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <div className={`${done ? 'text-primary' : 'text-slate-400'}`}>
                {done ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M17 9L10 16L7 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>
            <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
                <p className="text-xs text-slate-500">{assignee || 'Unassigned'}</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${priorityColors[priority] || 'bg-slate-100 text-slate-500'}`}>
                {priority}
            </span>
        </div>
    );
}
