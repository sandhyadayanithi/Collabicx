import React from 'react';

export default function Sidebar({ children, showLogo = false, footer }) {
    return (
        <aside className="w-16 md:w-64 border-r border-emerald-500/20 dark:border-emerald-500/20 flex flex-col items-center md:items-stretch py-6 gap-8 bg-white backdrop-blur-2xl sticky top-0 h-screen">
            {showLogo && (
                <div className="flex items-center gap-3 px-6 mb-2">
                    <img src="/logo.png" alt="Collabicx" className="size-16 object-contain" />
                    <div className="hidden md:flex flex-col text-white-forced">
                        <h1 className="text-emerald-900 dark:text-emerald-400 text-lg font-black leading-tight">Collabicx</h1>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2 px-4 flex-1">
                {children || (
                    <>
                        <div className="p-2 text-primary bg-primary/10 rounded-xl cursor-pointer flex items-center gap-3">
                            <span className="material-symbols-outlined">grid_view</span>
                            <span className="hidden md:block text-sm font-black">Dashboard</span>
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
