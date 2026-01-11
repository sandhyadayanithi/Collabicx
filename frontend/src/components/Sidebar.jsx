import React from 'react';

export default function Sidebar({ children, showLogo = false, footer }) {
    return (
        <aside className="w-16 md:w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center md:items-stretch py-6 gap-8 bg-white dark:bg-background-dark sticky top-0 h-screen">
            {showLogo && (
                <div className="flex items-center gap-3 px-6 mb-2">
                    <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white shrink-0">
                        <span className="material-symbols-outlined">hub</span>
                    </div>
                    <div className="hidden md:flex flex-col">
                        <h1 className="text-slate-900 dark:text-white text-base font-bold leading-tight">Hackathon Hub</h1>
                        <p className="text-slate-500 dark:text-[#9da6b9] text-xs font-medium">Management</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2 px-4 flex-1">
                {children || (
                    <>
                        <div className="p-2 text-primary bg-primary/10 rounded-xl cursor-pointer flex items-center gap-3">
                            <span className="material-symbols-outlined">grid_view</span>
                            <span className="hidden md:block text-sm font-semibold">Dashboard</span>
                        </div>
                        <div className="p-2 text-slate-400 hover:text-primary cursor-pointer transition-colors flex items-center gap-3">
                            <span className="material-symbols-outlined text-[24px]">folder</span>
                            <span className="hidden md:block text-sm font-medium">Files</span>
                        </div>
                        <div className="p-2 text-slate-400 hover:text-primary cursor-pointer transition-colors flex items-center gap-3">
                            <span className="material-symbols-outlined text-[24px]">task_alt</span>
                            <span className="hidden md:block text-sm font-medium">Tasks</span>
                        </div>
                        <div className="p-2 text-slate-400 hover:text-primary cursor-pointer transition-colors relative flex items-center gap-3">
                            <span className="material-symbols-outlined text-[24px]">notifications</span>
                            <span className="absolute top-1 left-5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark md:static md:hidden"></span>
                            <span className="hidden md:block text-sm font-medium">Notifications</span>
                        </div>
                    </>
                )}
            </div>

            <div className="mt-auto px-4 flex flex-col gap-2">
                {footer || (
                    <div className="p-2 text-slate-400 hover:text-primary cursor-pointer transition-colors flex items-center gap-3">
                        <span className="material-symbols-outlined text-[24px]">help</span>
                        <span className="hidden md:block text-sm font-medium">Help Center</span>
                    </div>
                )}
            </div>
        </aside>
    );
}
