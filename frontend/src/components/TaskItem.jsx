import React from 'react';

export default function TaskItem({ title, assignee, priority, done }) {
    const priorityColors = {
        High: "bg-primary/10 text-primary",
        Medium: "bg-amber-500/10 text-amber-500"
    };

    return (
        <div className="p-4 flex items-center gap-4 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <span className={`material-symbols-outlined ${done ? 'text-primary' : 'text-slate-400'}`}>
                {done ? 'check_circle' : 'radio_button_unchecked'}
            </span>
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
