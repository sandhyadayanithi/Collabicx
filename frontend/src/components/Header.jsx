import React from 'react';
import { Link } from 'react-router-dom';

export default function Header({ title = "Team Alpha-Bits", hideSearch = false, children }) {
    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 lg:px-10 py-3 bg-white dark:bg-background-dark sticky top-0 z-50">
            <div className="flex items-center gap-8">
                <Link to="/" className="flex items-center gap-3 text-primary hover:opacity-80 transition-opacity">
                    <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined">hub</span>
                    </div>
                    <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight">Collabicx</h2>
                </Link>
                {!hideSearch && (
                    <label className="hidden md:flex flex-col min-w-40 h-10 max-w-64">
                        <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                            <div className="text-slate-400 flex border-none bg-slate-100 dark:bg-slate-800 items-center justify-center pl-4 rounded-l-lg">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </div>
                            <input className="form-input flex w-full min-w-0 flex-1 border-none bg-slate-100 dark:bg-slate-800 focus:outline-0 focus:ring-0 text-slate-900 dark:text-white h-full placeholder:text-slate-400 px-4 rounded-r-lg pl-2 text-sm font-normal" placeholder="Search workspace..." />
                        </div>
                    </label>
                )}
            </div>
            <div className="flex items-center gap-6">
                <nav className="hidden lg:flex items-center gap-6">
                    {children || (
                        <>
                            <a className="text-primary text-sm font-semibold" href="#">Dashboard</a>
                            <a className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors text-sm font-medium" href="#">Files</a>
                            <a className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors text-sm font-medium" href="#">Calendar</a>
                            <a className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors text-sm font-medium" href="#">Settings</a>
                        </>
                    )}
                </nav>
                <div className="h-6 w-px bg-slate-200 dark:border-slate-800"></div>
                <button className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-9 px-4 bg-primary text-white text-sm font-bold transition-all hover:bg-primary/90">
                    <span className="truncate">New Project</span>
                </button>
                <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 border border-slate-200 dark:border-slate-800"
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCKjUQ66xDalBfRsaC936ij73oYH25Apri9FE6H6BODXUu6yDFtQCLf6dmmT4HPojEzYpJb6DxQRSa87aYM6wXtpd73Y29VWkJiqx2XfUT0oiGB0Y8hlQ1L1FQxYtQeNtcFtZGUfn-3lWBkgn8tesgpeKsvpLxCGUS5YNnELL55p1QZFeSc8C8t5V2MsuYqWbaf78d7yBszxR2Y2V4FulzYB4XgVVGQd747I7GFda_r1YdZZUAj34NUFGTMI7epdBJecOou6ca9pnR_")' }}
                ></div>
            </div>
        </header>
    );
}
