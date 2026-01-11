import React from 'react';

export default function Sidebar({ children, showLogo = false, footer }) {
    return (
        <aside className="w-16 md:w-64 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center md:items-stretch py-6 gap-8 bg-white dark:bg-background-dark h-full">
            {showLogo && (
                <div className="flex items-center gap-3 px-6 mb-2">
                    <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white shrink-0">
                        <span className="material-symbols-outlined">hub</span>
                    </div>
                    <div className="hidden md:flex flex-col">
                        <h1 className="text-slate-900 dark:text-white text-base font-bold leading-tight">Collabicx</h1>
                        <p className="text-slate-500 dark:text-[#9da6b9] text-xs font-medium">Management</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2 px-4 flex-1">
                {children}
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
