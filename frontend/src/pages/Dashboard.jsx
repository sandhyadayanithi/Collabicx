import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HackathonCard from '../components/HackathonCard';
import TaskItem from '../components/TaskItem';
import NewHackathonModal from '../components/NewHackathonModal';

export default function Dashboard() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Profile Header */}
            <div className="flex flex-col @[520px]:flex-row @[520px]:items-center justify-between gap-6 bg-white dark:bg-slate-900/40 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex gap-5 items-center">
                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl size-20 shadow-lg border-2 border-primary/20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBqKVE-Fbz3DwX1MnQJDpDIqR6p5m0lOIH-zp5X8kkzZgXoTl4c64rAZgNVdEF49u0cXw3QrP2tbgu6yhpsYVi2JTDo8Zn-ntzG6W0-JA9rxNoDAsyjbZZgo_EPnhgppLkpbu6lmE8AF5naq7qR3F_G4E3TjbyryMKlyCH10U52PDC4euYvmZdkJVM4ojFAiQMVbJzs8YM2hH4ArN3JGnTV2MeOT0FYd-Y8MH2tqvhueBgAPCQfHi2aR-cz8monZIWrzZ0a4PJur4wE")' }}></div>
                    <div className="flex flex-col">
                        <h1 className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">Team Alpha-Bits</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">groups</span> Hackathon Workspace
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">Join Code: XJ9-22L</span>
                            <button className="text-primary hover:text-primary/80 transition-colors">
                                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="flex-1 @[480px]:flex-none flex items-center justify-center gap-2 rounded-lg h-10 px-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                        Invite
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 @[480px]:flex-none flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        New Hackathon
                    </button>
                </div>
            </div>

            {/* Active Hackathons Section */}
            <div>
                <div className="flex items-center justify-between px-2 mb-4">
                    <h2 className="text-slate-900 dark:text-white text-xl font-bold">Active Hackathons</h2>
                    <button className="text-primary text-sm font-semibold hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div onClick={() => navigate('/workspace')} className="cursor-pointer">
                        <HackathonCard
                            title="AI Safety Hackathon"
                            TimeInfo="Started 3 days ago • 4 days remaining"
                            status="Ongoing"
                            progress={65}
                            image="https://lh3.googleusercontent.com/aida-public/AB6AXuB9PAOY0tIhO6AfT2CPKIxambugzwRa53Hrf3QnXFSdGFg-NWOtJ7pNhPOM7HGmtq1RrRWkdaNeq2ntVNuINMsfej13ZfcOWQW67K7DADu5iCo_N5tPXJrjK4f8kkbXOT8Fpk2jJDNlujC-3V8AnjV49G6UgkJZUeeB9CHZOeE4gv3h0oMR9UaoRkQX4uh2WI9UPFvHcq3zAY3z-Kv11Z9nfQ4LBTkS-zxMMQXs5iP0ggXcbS35NVRtltCkIYpyDhHt3pGjzgCoZhOQ"
                            participants={[
                                "https://lh3.googleusercontent.com/aida-public/AB6AXuC9hJOAFG2XiMgpjYuLWPxrHwAuaQR9TIKB8Y9GUMVPskB9CMJM7Mzp3OcAwHlj3x019E23GDcKwK-csi07zRz1JA8AU-It0VjKaIAmjX7cXOZSEv3IaovEXzZevdPch7OgY1wiI46rwuTyl3-byww3TcVVgezi5b61eeHIC7ULSz0BY1bX7tmDxoNXfYxEUIGFFhPVR8e-3PdCEw356K3638sFSTrWaIYE7qW6TqWxr6ijcdaNnRzdWcYL7hT2qtnNEkto_s6qjzSj",
                                "https://lh3.googleusercontent.com/aida-public/AB6AXuBP4owmbzhsBuK-1C6HnKHPp-8pKR-Yf2N7uNbKFB4IW9XAotRmvr5ONCIzW5VfPe7xifY-IDjsy5BI3SPApLH9dpt2QYMf6rOoo0dCx8oVWyH1bvXqLCs5jdub-cM3GtlcESqI1WhPdQP-xnZQ0qS2RVcfNmlr8VPJOFCaxUw3a5o4Dza9qzG9I-3_zgAhEYx437BoAy4DC-pktGlrgJE08RMM43NgyWVFpV412ejQuj5vesJ1PqnKwfB1Kr7lqcCsbGG1EsaElCG2"
                            ]}
                        />
                    </div>
                    <div onClick={() => navigate('/workspace')} className="cursor-pointer">
                        <HackathonCard
                            title="Fintech Innovation"
                            TimeInfo="Ended 1 week ago • Winner: Team Alpha"
                            status="Completed"
                            finished={true}
                            image="https://lh3.googleusercontent.com/aida-public/AB6AXuBqlyjqBs7awaDqZHxrHo-mvWqGj6FluRUPiNRGJBfWbY3j5d5KG8c_AauSSXPrGx2tvJeJSZkobQ9jgExvDiRNXFvT7QpNLIT92KKuWef3Mb5tcmlQV70QZb6ex9c7gop6hKoyNE-Js1t8zB3BYPMqtaV6pDZOA7TbTY2xxZJZhVEpXNV_owltDm-AuzOlXdpT5f6E4L14DCydxJmr9hDVImz-GfY92uePHeUCZ69ybOVAhIhe_k46l4vcdkrjr-A_aG6obBwsv8Ga"
                        />
                    </div>
                </div>
            </div>

            {/* Recent Tasks / Activity */}
            <div className="space-y-4">
                <h2 className="text-slate-900 dark:text-white text-xl font-bold px-2">Project Tasks</h2>
                <div className="bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                    <TaskItem
                        title="Implement OAuth Login"
                        assignee="Assigned to Sarah M."
                        priority="High"
                        done={true}
                    />
                    <TaskItem
                        title="Design Landing Page Hero"
                        assignee="Unassigned"
                        priority="Medium"
                        done={false}
                    />
                </div>
            </div>
            {/* New Hackathon Modal */}
            <NewHackathonModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                teamId="team-alpha-bits-id"
            />
        </div>
    );
}
