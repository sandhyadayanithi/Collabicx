import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { logout, deleteUserAccount } from '../firebase/functions';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [bio, setBio] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setUserData(data);
                    setName(data.name || '');
                    setRole(data.role || '');
                    setBio(data.bio || '');
                }
            } else {
                navigate('/login');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!auth.currentUser) return;

        setIsSaving(true);
        setMessage({ text: '', type: '' });
        try {
            const userRef = doc(db, "users", auth.currentUser.uid);
            await updateDoc(userRef, {
                name,
                role,
                bio,
                updatedAt: new Date()
            });
            setMessage({ text: 'Profile updated successfully!', type: 'success' });
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ text: 'Failed to update profile. Please try again.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone and you will be removed from all teams.")) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteUserAccount(auth.currentUser.uid);
            navigate('/');
        } catch (error) {
            console.error("Delete account error:", error);
            setMessage({ text: 'Failed to delete account. You may need to login again first.', type: 'error' });
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="text-slate-900 dark:text-slate-100 font-display min-h-screen bg-background-light dark:bg-background-dark">
            <Header title="My Profile" backPath="/dashboard" />

            <main className="flex-1 p-6 md:p-10 lg:p-16 max-w-4xl mx-auto w-full">
                <div className="vibrant-card rounded-[32px] border border-emerald-500/20 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {/* Profile Header Background */}
                    <div className="h-32 bg-gradient-to-r from-emerald-500/30 via-green-600/20 to-transparent relative">
                        <div className="absolute -bottom-16 left-10 p-1.5 vibrant-card rounded-full border-none">
                            <div
                                className="size-32 rounded-full border-4 border-white dark:border-emerald-900 shadow-xl bg-slate-100 dark:bg-emerald-900/40 bg-cover bg-center"
                                style={{ backgroundImage: `url(${userData?.avatar})` }}
                            ></div>
                        </div>
                    </div>

                    <div className="pt-20 px-10 pb-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                            <div>
                                <h1 className="text-3xl font-black text-vibrant-primary mb-1">
                                    {userData?.name || 'User'}
                                </h1>
                                <p className="text-vibrant-secondary font-black tracking-wide">
                                    @{userData?.username || 'username'}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="h-11 px-8 bg-primary hover:bg-primary/90 text-emerald-950 rounded-xl font-black transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>

                        {message.text && (
                            <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                                <p className="text-sm font-bold">{message.text}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-vibrant-secondary ml-1">Full Name</label>
                                    <input
                                        className="w-full h-13 px-5 vibrant-badge rounded-xl text-vibrant-primary placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-black"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-vibrant-secondary ml-1">Primary Role</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Developer', 'Designer', 'Product', 'Marketing'].map((r) => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setRole(r)}
                                                className={`h-11 rounded-xl border-2 font-black text-xs transition-all uppercase tracking-wider ${role === r ? 'border-primary bg-primary/10 text-primary shadow-inner shadow-primary/20' : 'vibrant-role-button hover:border-slate-500 dark:hover:border-emerald-500/40'}`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-vibrant-secondary ml-1">Bio</label>
                                <textarea
                                    className="w-full h-[164px] p-5 vibrant-badge rounded-xl text-vibrant-primary placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none font-bold"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell your team about yourself..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-emerald-500/10">
                            <h3 className="text-sm font-black text-vibrant-secondary uppercase tracking-[0.2em] mb-4">Account Information</h3>
                            <div className="flex flex-wrap gap-8 text-sm items-start justify-between">
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-vibrant-secondary font-black mb-1">Email Address</p>
                                        <p className="text-vibrant-primary font-black">{userData?.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-vibrant-secondary font-black mb-1">Joined</p>
                                        <p className="text-vibrant-primary font-black">
                                            {userData?.createdAt?.toDate ? userData.createdAt.toDate().toLocaleDateString() : 'Recent'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-vibrant-secondary font-black mb-1">Danger Zone</p>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={isDeleting}
                                        className="text-white font-bold bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-xs transition-colors disabled:opacity-50"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
