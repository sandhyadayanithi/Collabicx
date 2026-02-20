import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { listenToActivities } from '../firebase/functions';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const maskSensitive = (value) => {
  if (!value || typeof value !== 'string') return value;
  const trimmed = value.trim();
  const hasKeyword = /sk-|api_|token|key/i.test(trimmed);
  const isLongRandom = /^[A-Za-z0-9_\-]{24,}$/.test(trimmed);
  if (hasKeyword || isLongRandom) {
    const start = trimmed.slice(0, 4);
    const end = trimmed.slice(-4);
    return `${start}••••${end}`;
  }
  return trimmed;
};

const getTarget = (metadata = {}) => {
  const target =
    metadata.teamName ||
    metadata.projectName ||
    metadata.hackathonName ||
    metadata.repoName ||
    metadata.label ||
    metadata.url ||
    metadata.title ||
    '';

  return maskSensitive(target);
};

const ActivityItem = ({ activity }) => {
  const [user, setUser] = useState(null);
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    if (activity.userId) {
      getDoc(doc(db, "users", activity.userId)).then(snap => {
        if (snap.exists()) setUser(snap.data());
      });
    }
  }, [activity.userId]);

  useEffect(() => {
    if (activity?.metadata?.teamName) {
      setTeamName(activity.metadata.teamName);
      return;
    }
    if (activity.teamId) {
      getDoc(doc(db, "teams", activity.teamId)).then(snap => {
        if (snap.exists()) setTeamName(snap.data().name || '');
      });
    }
  }, [activity.teamId, activity?.metadata?.teamName]);

  const getIcon = (type) => {
    switch (type) {
      case 'create_team': return 'add_circle';
      case 'join_team': return 'person_add';
      case 'send_message': return 'chat';
      case 'connect_repo': return 'code';
      case 'add_asset': return 'attach_file';
      case 'share_secret': return 'key';
      case 'create_team_opening': return 'campaign';
      case 'apply_to_team': return 'forward_to_inbox';
      case 'create_hackathon': return 'event_available';
      case 'add_task': return 'task_alt';
      case 'complete_task': return 'check_circle';
      case 'update_note': return 'edit_note';
      default: return 'notifications';
    }
  };

  const getActionText = (activity) => {
    const { type } = activity;
    switch (type) {
      case 'create_team': return 'created team';
      case 'join_team': return activity?.metadata?.source === 'discover' ? 'joined team via Discover' : 'joined team';
      case 'send_message': return 'sent a message';
      case 'connect_repo': return 'connected repo to';
      case 'add_asset': return 'added an asset to';
      case 'share_secret': return 'shared a secret in';
      case 'create_team_opening': return 'posted a team opening for';
      case 'apply_to_team': return 'applied to join';
      case 'create_hackathon': return 'added a new hackathon:';
      case 'add_task': return 'added a task:';
      case 'complete_task': return 'completed a task:';
      case 'update_note': return 'updated the shared notes';
      default: return 'performed an action in';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    return `${Math.floor(seconds / 86400)} d ago`;
  };

  const target = getTarget(activity.metadata);
  const secondaryDetail = maskSensitive(
    activity?.metadata?.maskedValue ||
    (activity.type !== 'send_message' ? activity?.metadata?.messagePreview : '') ||
    activity?.metadata?.secretName ||
    ''
  );

  return (
    <div className={`flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-all ${activity.isNew ? 'animate-slide-in-right' : ''}`}>
      <div className="relative">
        <div
          className="size-10 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-800 shadow-sm"
          style={{ backgroundImage: `url(${user?.avatar || 'https://www.gravatar.com/avatar?d=mp'})` }}
        ></div>
        <div className="absolute -bottom-1 -right-1 size-5 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
          <span className="material-symbols-outlined text-[10px]">{getIcon(activity.type)}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-0.5">
        <p className="text-sm font-black text-vibrant-primary flex flex-wrap gap-1">
          <span className="text-primary">{user?.username || user?.name || 'Someone'}</span>
          <span>{getActionText(activity)}</span>
          {target ? <span className="text-slate-700 dark:text-slate-200">{activity.type.includes('task') ? `"${target}"` : target}</span> : null}
          {teamName ? <span className="text-slate-500 dark:text-slate-400">in</span> : null}
          {teamName ? <span className="text-slate-700 dark:text-slate-200">{teamName}</span> : null}
        </p>
        {secondaryDetail ? (
          <p className="text-[11px] text-slate-500 font-medium line-clamp-1">{secondaryDetail}</p>
        ) : null}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{formatTime(activity.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default function ActivityPanel({ teamIds = [] }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);
  const teamIdsKey = teamIds.join(',');
  const maxItems = 5;

  const mergeActivities = (incoming, markNew = false) => {
    setActivities(prev => {
      const map = new Map(prev.map(a => [a.id, a]));
      incoming.forEach(a => {
        const exists = map.has(a.id);
        map.set(a.id, {
          ...a,
          isNew: markNew && !exists
        });
      });
      const merged = Array.from(map.values());
      return merged
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, maxItems);
    });
  };

  useEffect(() => {
    if (teamIds.length === 0) {
      setLoading(false);
      setActivities([]);
      hasLoadedOnce.current = false;
      return;
    }

    setLoading(true);
    const unsubscribe = listenToActivities(teamIds, (newActivities) => {
      mergeActivities(newActivities, hasLoadedOnce.current);
      setLoading(false);
      if (!hasLoadedOnce.current) hasLoadedOnce.current = true;
    });

    return () => unsubscribe();
  }, [teamIdsKey]);

  useEffect(() => {
    if (!teamIds.length) return;
    const socketUrl = import.meta.env.VITE_ACTIVITY_SOCKET_URL || 'http://localhost:4000';
    const socket = io(socketUrl, { transports: ['websocket'] });

    socket.emit('activity:subscribe', { teamIds });
    socket.on('activity:new', (activity) => {
      mergeActivities([activity], true);
    });

    return () => {
      socket.emit('activity:unsubscribe', { teamIds });
      socket.off('activity:new');
      socket.disconnect();
    };
  }, [teamIdsKey]);

  useEffect(() => {
    if (!activities.some(a => a.isNew)) return;
    const timer = setTimeout(() => {
      setActivities(prev => prev.map(a => a.isNew ? { ...a, isNew: false } : a));
    }, 800);
    return () => clearTimeout(timer);
  }, [activities]);

  return (
    <aside className="w-80 border-l border-slate-200 dark:border-white/10 flex flex-col h-full bg-white dark:bg-transparent overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-white/10">
        <h3 className="text-lg font-black text-vibrant-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">history</span>
          Recent Activity
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 opacity-50">
            <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Tracking Pulse...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-4 opacity-40">
            <span className="material-symbols-outlined text-4xl">cloud_off</span>
            <p className="text-xs font-black uppercase tracking-widest leading-loose">No recent activity yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {activities.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50/50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10">
        <p className="text-[10px] text-center text-slate-500 font-black uppercase tracking-widest">
          SYNCED WITH REAL-TIME FEED
        </p>
      </div>
    </aside>
  );
}
