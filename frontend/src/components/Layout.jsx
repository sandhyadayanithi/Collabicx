import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatSidebar from './ChatSidebar';

export default function Layout() {
    return (
        <div className="text-slate-900 dark:text-white min-h-screen flex flex-col font-display">
            <Header />
            <div className="flex-1 flex overflow-hidden">
                <Sidebar />
                <main className="@container flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
                    <Outlet />
                </main>
                <ChatSidebar />
            </div>
        </div>
    );
}
