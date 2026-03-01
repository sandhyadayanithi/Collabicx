import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import PitchModule from '../components/PitchModule';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { logout } from '../firebase/functions';

export default function PitchPractice() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return navigate('/login');

      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUserData({ id: user.uid, ...data });
        if (!(data.profession || data.usageRole || data.username)) {
          navigate('/profile-setup');
          return;
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-[#072724] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="text-slate-100 font-display min-h-screen flex bg-[#031514] selection:bg-emerald-500/30">
      {/* Background gradients for depth */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full"></div>
      </div>

      <Sidebar
        showLogo={true}
        footer={
          <>
            <div
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 px-3 py-2 text-emerald-300/80 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <div
                className="size-6 rounded-full bg-cover bg-center border border-slate-800"
                style={{ backgroundImage: `url(${userData?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKjUQ66xDalBfRsaC936ij73oYH25Apri9FE6H6BODXUu6yDFtQCLf6dmmT4HPojEzYpJb6DxQRSa87aYM6wXtpd73Y29VWkJiqx2XfUT0oiGB0Y8hlQ1L1FQxYtQeNtcFtZGUfn-3lWBkgn8tesgpeKsvpLxCGUS5YNnELL55p1QZFeSc8C8t5V2MsuYqWbaf78d7yBszxR2Y2V4FulzYB4XgVVGQd747I7GFda_r1YdZZUAj34NUFGTMI7epdBJecOou6ca9pnR_'})` }}
              ></div>
              <p className="text-sm font-black">My Profile</p>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-900/10 rounded-lg transition-colors cursor-pointer text-left">
              <span className="material-symbols-outlined">logout</span>
              <p className="text-sm font-black">Logout</p>
            </button>
          </>
        }
      >
        <a
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-emerald-300/80 hover:bg-emerald-500/10 transition-colors cursor-pointer"
          onClick={() => navigate('/teams')}
        >
          <span className="material-symbols-outlined shrink-0">groups</span>
          <p className="text-sm font-black">My Teams</p>
        </a>
        <a
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-emerald-300/80 hover:bg-emerald-500/10 transition-colors cursor-pointer"
          onClick={() => navigate('/discover')}
        >
          <span className="material-symbols-outlined shrink-0">explore</span>
          <p className="text-sm font-black">Discover</p>
        </a>
        <a
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-500/10 border-l-[3px] border-emerald-500 text-emerald-400 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined shrink-0">campaign</span>
          <p className="text-sm font-black">Pitch Practice</p>
        </a>
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            <header className="mb-10 text-center md:text-left">
              <h1 className="text-4xl font-black text-white mb-3 tracking-tight drop-shadow-sm">
                Pitch <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Practice</span>
              </h1>
              <p className="text-slate-400 font-medium text-md max-w-3xl">
                Refine your elevator pitch with <span className="text-emerald-500/80 font-bold">AI-powered</span> feedback. Modern, minimal, and built for clarity.
              </p>
            </header>

            <PitchModule
              userId={userData?.id}
              credits={userData?.credits || 0}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
