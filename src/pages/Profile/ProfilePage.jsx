import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMe, updateMe, getFriends, removeFriend } from '../../services/userApi.js';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Settings, Eye, EyeOff, Mail, Wifi, WifiOff,
  Users, UserMinus, MessageCircle, Shield, Calendar, ChevronRight
} from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal.jsx';

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const [meRes, friendsRes] = await Promise.all([getMe(), getFriends()]);
        setProfile(meRes.user);
        setFriends(friendsRes.friends || []);
      } catch (e) {
        setError(e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  async function handleRemoveFriend(friendId, friendName) {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Friend',
      message: `Are you sure you want to remove ${friendName} from your friends list?`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await removeFriend(friendId);
          setFriends(prev => prev.filter(f => f._id !== friendId));
          toast.success('Friend removed');
        } catch (e) {
          toast.error(e.message || 'Failed to remove friend');
        }
      }
    });
  }

  async function handleToggleSetting(key) {
    const currentVal = profile.settings?.[key] ?? true;
    const next = { ...profile.settings, [key]: !currentVal };
    try {
      const res = await updateMe({ settings: next });
      setProfile(res.user);
      toast.success('Setting updated');
    } catch (e) {
      toast.error(e.message || 'Failed to update settings');
    }
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }
  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-red-400">{error}</p>
      </main>
    );
  }

  const settingsConfig = [
    {
      key: 'isSearchable',
      label: 'Public Visibility',
      desc: 'Allow your profile to appear in search results',
      IconOn: Eye,
      IconOff: EyeOff,
    },
    {
      key: 'searchableByEmail',
      label: 'Email Discovery',
      desc: 'Allow others to find you by email address',
      IconOn: Mail,
      IconOff: Mail,
    },
    {
      key: 'showLastSeen',
      label: 'Online Status',
      desc: 'Show your online / last seen status to others',
      IconOn: Wifi,
      IconOff: WifiOff,
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 transition hover:bg-slate-700 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Profile & Privacy</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* ───── User Card ───── */}
        <div className="card col-span-1 flex flex-col items-center p-6 border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm shadow-xl h-fit animate-fadeIn">
          <div className="relative mb-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-3xl font-bold text-white shadow-lg shadow-brand-900/30">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-400 border-[3px] border-slate-900 shadow" />
          </div>
          <h2 className="text-xl font-bold text-white text-center break-words w-full">{profile.name}</h2>
          <p className="text-brand-400 font-medium text-sm font-mono">@{profile.comradeId}</p>

          <div className="mt-6 w-full space-y-4 border-t border-slate-800/60 pt-6">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-lg bg-slate-800/60">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <span className="text-slate-200 break-all text-sm truncate">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-lg bg-slate-800/60">
                <Shield className="h-4 w-4 text-slate-400" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-lg bg-slate-800/60">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <span className="text-slate-400 text-xs">Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* ───── Settings ───── */}
        <div className="card col-span-2 p-6 border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm shadow-xl animate-fadeIn">
          <h2 className="mb-5 text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="h-5 w-5 text-brand-400" /> Settings
          </h2>
          <div className="space-y-3">
            {settingsConfig.map(({ key, label, desc, IconOn, IconOff }) => {
              const isOn = profile.settings?.[key] ?? true;
              const Icon = isOn ? IconOn : IconOff;
              return (
                <div key={key} className="flex items-center justify-between rounded-xl bg-slate-800/30 p-4 border border-slate-800/40 hover:border-slate-700/60 transition group">
                  <div className="flex items-center gap-3 pr-4">
                    <div className={`p-2 rounded-lg ${isOn ? 'bg-brand-600/20 text-brand-400' : 'bg-slate-800/60 text-slate-500'} transition`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-200 text-sm">{label}</h3>
                      <p className="text-[11px] text-slate-500">{desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center shrink-0">
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() => handleToggleSetting(key)}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500/50" />
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ───── Friends ───── */}
      <div className="card p-6 border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm shadow-xl animate-fadeIn">
        <h2 className="mb-5 text-xl font-bold text-slate-100 flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-400" /> My Friends
          {friends.length > 0 && (
            <span className="ml-2 text-xs font-normal bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{friends.length}</span>
          )}
        </h2>
        {friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-slate-500">
            <Users className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">No friends yet. Search for comrades on the dashboard!</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map(friend => (
              <div key={friend._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800/40 hover:border-slate-700/60 transition group">
                <Link to={`/profile/${friend.comradeId}`} className="flex items-center gap-3 hover:opacity-80 transition min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold shadow">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                    {friend.isOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-slate-900" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-200 font-medium text-sm truncate">{friend.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">@{friend.comradeId}</p>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemoveFriend(friend._id, friend.name)}
                  className="ml-2 p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 transition opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title="Remove friend"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ───── CONFIRMATION MODAL ───── */}
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </main>
  );
}

export default ProfilePage;
