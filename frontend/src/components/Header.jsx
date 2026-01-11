import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Header({ title = "Team Alpha-Bits", hideSearch = false, children }) {
    const navigate = useNavigate();
    const [userData, setUserData] = React.useState(null);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                }
            } else {
                setUserData(null);
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 lg:px-10 py-3 bg-white dark:bg-background-dark sticky top-0 z-50">
            <div className="flex items-center gap-8">
                <Link to="/teams" className="flex items-center gap-3 text-primary hover:opacity-80 transition-opacity">
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
                            <Link className="text-primary text-sm font-semibold" to="/dashboard">Dashboard</Link>
                            <Link className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors text-sm font-medium" to="/workspace">Workspace</Link>
                            <Link className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors text-sm font-medium" to="/teams">Teams</Link>
                            <Link className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors text-sm font-medium" to="/profile">Profile</Link>
                        </>
                    )}
                </nav>
                <div className="h-6 w-px bg-slate-200 dark:border-slate-800"></div>

                <div
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                >
                    <div className="hidden md:flex flex-col items-end">
                        <p className="text-xs font-black text-slate-900 dark:text-white leading-none mb-1">
                            {userData?.username ? `@${userData.username}` : (userData?.name || 'User')}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">
                            {userData?.role || 'Member'}
                        </p>
                    </div>
                    <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 border-2 border-slate-200 dark:border-slate-800 group-hover:border-primary transition-colors"
                        style={{ backgroundImage: `url(${userData?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKjUQ66xDalBfRsaC936ij73oYH25Apri9FE6H6BODXUu6yDFtQCLf6dmmT4HPojEzYpJb6DxQRSa87aYM6wXtpd73Y29VWkJiqx2XfUT0oiGB0Y8hlQ1L1FQxYtQeNtcFtZGUfn-3lWBkgn8tesgpeKsvpLxCGUS5YNnELL55p1QZFeSc8C8t5V2MsuYqWbaf78d7yBszxR2Y2V4FulzYB4XgVVGQd747I7GFda_r1YdZZUAj34NUFGTMI7epdBJecOou6ca9pnR_'})` }}
                    ></div>
                </div>
            </div>
        </header>
    );
}
