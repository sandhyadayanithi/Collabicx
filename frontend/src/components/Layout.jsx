import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatSidebar from './ChatSidebar';

export default function Layout() {
    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white h-screen flex flex-col font-display overflow-hidden">
            <Header />
            <div className="flex-1 flex overflow-hidden">
                <main className="@container flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 bg-slate-50/50 dark:bg-slate-900/50">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
