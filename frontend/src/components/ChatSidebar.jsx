import React from 'react';

export default function ChatSidebar() {
    return (
        <aside className="w-80 border-l border-emerald-500/20 dark:border-emerald-500/20 bg-white/60 dark:bg-black/40 backdrop-blur-2xl flex flex-col hidden lg:flex">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">chat_bubble</span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Team Chat</h3>
                </div>
                <div className="flex gap-2">
                    <button className="size-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Today</span>
                    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-cover" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAo-IiXDUHfaQV-jwkfih4w7h_zppZAXeJkk036cGpFZgdwxyiyxuZtQQES2PyP3nrupwV0v_-5RuQvv10qzy-1ftqRtzq7vgy-U9PjeCJ1Zt46bfpFGT0zAx6koTTUy-dmLNoLVK-0FP1eC-e7xS8AtJaqLe0XnLOhr-A-jHlDlAClSJNDKQ8fhgqguaSFg1HT0pWXDKEI1LsTSpiWmzYd5_XaRZOIE3j6RlZ9HHGAoq_-WLpmKRyErxbYyErfi440XNaR56zTDx08')" }}></div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Marcus Dev</span>
                        <span className="text-[10px] text-slate-400">10:42 AM</span>
                    </div>
                    <div className="ml-8 p-3 rounded-lg rounded-tl-none bg-slate-100 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300">
                        Just pushed the initial API scaffolding to the repo. Check it out guys! 🚀
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-cover" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAmHn8rP5J9f7ihBq3LICaf8oSwJu-nvF4mmnSpDpuSeFWmcgQFLVclBeJPUZRCz0A761H938QiHOGfwbMT2o4tAXpdDQ3LxqtnFFpoVGf5W76GLV32GmWIXzFMU5oZXqHA2aAURHMdj1q-MU82lJ0yZYBfMxDI9OEm-2aJ3pmSE6HEZ3C3Dcx8Qv2vcfiYwa8xMnCEsG6oV3n0cxKIvhR4AxGTwFNXD58jNWVHg5Cn9BabBBgluc4XtXyHJkGX40I9bZHNsV2L2s_h')" }}></div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Sarah Chen</span>
                        <span className="text-[10px] text-slate-400">10:45 AM</span>
                    </div>
                    <div className="ml-8 p-3 rounded-lg rounded-tl-none bg-primary/10 border border-primary/20 text-sm text-slate-700 dark:text-slate-300">
                        On it! I'll start working on the frontend integration now.
                        <div className="mt-2 p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">description</span>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[11px] font-bold truncate">api-docs.md</p>
                                <p className="text-[10px] text-slate-400">2.4 MB</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 justify-center text-[10px] font-medium text-slate-400 py-2">
                    <span className="material-symbols-outlined text-[14px]">bolt</span>
                    <span>Github: 3 commits merged to main</span>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">11:05 AM</span>
                        <span className="text-xs font-bold text-primary">You</span>
                    </div>
                    <div className="mr-0 p-3 rounded-lg rounded-tr-none bg-primary text-white text-sm shadow-sm">
                        Great progress. I'll handle the UI design tweaks this afternoon.
                    </div>
                </div>
            </div>

            <div className="p-4 bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800">
                <div className="relative">
                    <textarea className="form-textarea w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-primary focus:border-primary text-sm min-h-[80px] pb-10 custom-scrollbar resize-none dark:text-white dark:placeholder-slate-500" placeholder="Type a message..."></textarea>
                    <div className="absolute bottom-3 left-3 flex gap-2">
                        <button className="size-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                        </button>
                        <button className="size-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500">
                            <span className="material-symbols-outlined text-[18px]">mood</span>
                        </button>
                    </div>
                    <button className="absolute bottom-3 right-3 size-7 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-[18px]">send</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
