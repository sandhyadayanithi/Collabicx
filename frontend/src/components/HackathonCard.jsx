import React from 'react';

export default function HackathonCard({ title, status, TimeInfo, progress, participants, image, finished }) {
    const isCompleted = status === 'Completed';

    return (
        <div className="flex flex-col bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-primary/50 transition-all">
            <div
                className="w-full bg-center bg-no-repeat aspect-video bg-cover relative"
                style={{ backgroundImage: `url("${image}")` }}
            >
                <div className={`absolute top-3 right-3 px-3 py-1 ${isCompleted ? 'bg-slate-500' : 'bg-green-500'} text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg`}>
                    {status}
                </div>
            </div>
            <div className="p-5 space-y-4">
                <div>
                    <p className="text-slate-900 dark:text-white text-lg font-bold">{title}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{TimeInfo}</p>
                </div>

                {progress !== undefined && (
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-6 justify-between items-center">
                            <p className="text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase">Project Progress</p>
                            <p className="text-primary text-sm font-bold">{progress}%</p>
                        </div>
                        <div className="rounded-full bg-slate-100 dark:bg-slate-800 h-2.5 w-full overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {finished && (
                    <div className="flex flex-col gap-2 opacity-60">
                        <div className="flex gap-6 justify-between items-center">
                            <p className="text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase">Final Score</p>
                            <p className="text-slate-900 dark:text-white text-sm font-bold">100%</p>
                        </div>
                        <div className="rounded-full bg-slate-100 dark:bg-slate-800 h-2.5 w-full overflow-hidden">
                            <div className="h-full rounded-full bg-slate-400" style={{ width: "100%" }}></div>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between pt-2">
                    {participants ? (
                        <div className="flex -space-x-2">
                            {participants.map((p, i) => (
                                <div key={i} className="size-8 rounded-full border-2 border-white dark:border-slate-900 bg-cover" style={{ backgroundImage: `url('${p}')` }}></div>
                            ))}
                            <div className="size-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">+3</div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-yellow-500 text-[20px]">emoji_events</span>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Top 3 Finish</span>
                        </div>
                    )}
                    <button className="text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">{finished ? 'visibility' : 'arrow_forward'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
