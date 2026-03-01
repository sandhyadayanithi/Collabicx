import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PitchModule from '../components/PitchModule';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { logout, getUserTeams, getHackathons, getHackathonDetails } from '../firebase/functions';

export default function PitchPractice() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Team & Hackathon selection
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState('');
  const [hackathonIdea, setHackathonIdea] = useState(null);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [hackathonsLoading, setHackathonsLoading] = useState(false);

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
        // Fetch user's teams
        setTeamsLoading(true);
        try {
          const userTeams = await getUserTeams(user.uid);
          setTeams(userTeams);
        } catch (e) {
          console.error('Failed to load teams:', e);
        } finally {
          setTeamsLoading(false);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [navigate]);

  // Fetch hackathons when team changes
  useEffect(() => {
    if (!selectedTeamId) {
      setHackathons([]);
      setSelectedHackathonId('');
      setHackathonIdea(null);
      return;
    }
    setHackathonsLoading(true);
    getHackathons(selectedTeamId)
      .then(data => { setHackathons(data); })
      .catch(e => console.error('Failed to load hackathons:', e))
      .finally(() => setHackathonsLoading(false));
  }, [selectedTeamId]);

  // Fetch hackathon idea (theme) when hackathon changes
  useEffect(() => {
    if (!selectedTeamId || !selectedHackathonId) {
      setHackathonIdea(null);
      return;
    }
    getHackathonDetails(selectedTeamId, selectedHackathonId).then(data => {
      setHackathonIdea(data?.theme || null);
    });
  }, [selectedTeamId, selectedHackathonId]);

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
            <header className="mb-8 text-center md:text-left">
              <h1 className="text-4xl font-black text-white mb-3 tracking-tight drop-shadow-sm">
                Pitch <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Practice</span>
              </h1>
              <p className="text-slate-400 font-medium text-md max-w-3xl">
                Refine your elevator pitch with <span className="text-emerald-500/80 font-bold">AI-powered</span> feedback. Modern, minimal, and built for clarity.
              </p>
            </header>

            {/* Team & Hackathon Context Selectors */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2 text-slate-400 text-sm font-bold shrink-0">
                <span className="material-symbols-outlined text-[18px] text-emerald-500">target</span>
                Practice context
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Team selector */}
                <div className="relative flex-1">
                  <select
                    value={selectedTeamId}
                    onChange={e => { setSelectedTeamId(e.target.value); setSelectedHackathonId(''); }}
                    disabled={teamsLoading}
                    className="w-full appearance-none bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-medium focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <option value="">
                      {teamsLoading ? 'Loading teams...' : 'Select a team (optional)'}
                    </option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-500 pointer-events-none">expand_more</span>
                </div>

                {/* Hackathon selector */}
                {selectedTeamId && (
                  <div className="relative flex-1">
                    <select
                      value={selectedHackathonId}
                      onChange={e => setSelectedHackathonId(e.target.value)}
                      disabled={hackathonsLoading}
                      className="w-full appearance-none bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-medium focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <option value="">
                        {hackathonsLoading ? 'Loading...' : hackathons.length > 0 ? 'Select a project' : 'No projects found'}
                      </option>
                      {hackathons.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-500 pointer-events-none">expand_more</span>
                  </div>
                )}
              </div>

              {/* Idea badge */}
              {selectedHackathonId && (
                <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${hackathonIdea ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800/80 border-white/5 text-slate-500'}`}>
                  <span className="material-symbols-outlined text-[13px]">{hackathonIdea ? 'check_circle' : 'radio_button_unchecked'}</span>
                  {hackathonIdea ? 'Idea set' : 'No idea set'}
                </div>
              )}
            </div>

            <PitchModule
              userId={userData?.id}
              credits={userData?.credits || 0}
              hackathonIdea={hackathonIdea}
              selectedTeamId={selectedTeamId}
              selectedHackathonId={selectedHackathonId}
              onIdeaSaved={(idea) => setHackathonIdea(idea)}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
