import { useNavigate } from 'react-router-dom';

export default function HackathonCard({
    id,
    teamId,
    title,
    status,
    TimeInfo,
    progress = 0,
    participants = [],
    image,
    daysLeft,
    nextDeadline
}) {
    const navigate = useNavigate();
    const isCompleted = status === 'Completed';

    return (
        <div
            onClick={() => navigate(`/workspace/${teamId}/${id}`)}
            className="flex flex-col bg-white backdrop-blur-2xl rounded-xl border border-emerald-500/20 dark:border-emerald-500/20 overflow-hidden hover:border-primary/50 transition-all cursor-pointer group"
        >
            <div
                className="w-full bg-center bg-no-repeat aspect-video bg-cover relative"
                style={{ backgroundImage: `url("${image}")` }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                <div className={`absolute top-3 right-3 px-3 py-1 ${isCompleted ? 'bg-slate-500/90' : 'bg-green-500/90'} backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm`}>
                    {status}
                </div>

                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                    <div>
                        <h3 className="text-white text-lg font-bold leading-tight mb-1">{title}</h3>
                        <p className="text-white/80 text-xs font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            {TimeInfo}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-5">
                {/* Stats Row */}
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50 flex flex-col gap-1">
                        <span className="text-slate-500 dark:text-white font-semibold uppercase text-[10px] tracking-wider">Days Left</span>
                        <span className="font-bold text-slate-900 dark:text-white text-base">{daysLeft || '--'}</span>
                    </div>
                    <div className="flex-[1.5] bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/50 flex flex-col gap-1">
                        <span className="text-slate-500 dark:text-white font-semibold uppercase text-[10px] tracking-wider">Next Deadline</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate">{nextDeadline || 'No deadlines'}</span>
                    </div>
                </div>

                {/* Progress */}
                <div className="flex flex-col gap-2">
                    <div className="flex gap-6 justify-between items-center">
                        <p className="text-slate-400 dark:text-white text-[10px] font-bold uppercase tracking-wider">Completion</p>
                        <p className="text-slate-700 dark:text-white text-xs font-bold">{progress}%</p>
                    </div>
                    <div className="rounded-full bg-slate-100 dark:bg-slate-800 h-1.5 w-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                {/* Footer: Participants & Actions */}
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between gap-3">
                    <div>
                        {/* Participants removed as per request */}
                    </div>

                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 dark:text-white hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Edit">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                            onClick={() => navigate(`/workspace/${teamId}/${id}`)}
                            className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            Open
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
