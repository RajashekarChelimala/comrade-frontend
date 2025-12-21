import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

import { getMe, updateMe, getFriends, removeFriend } from '../../services/userApi.js';
import toast from 'react-hot-toast';

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // only load if we have a user
    if (!user) return;

    async function load() {
      try {
        const [meRes, friendsRes] = await Promise.all([
          getMe(),
          getFriends()
        ]);
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

  async function handleRemoveFriend(friendId) {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      await removeFriend(friendId);
      setFriends(prev => prev.filter(f => f._id !== friendId));
      toast.success('Friend removed');
    } catch (e) {
      toast.error(e.message || 'Failed to remove friend');
    }
  }

  async function handleToggleSetting(key) {
    // Default to true if undefined, matching the UI and Schema defaults
    const currentVal = profile.settings?.[key] ?? true;
    const next = {
      ...profile.settings,
      [key]: !currentVal,
    };
    try {
      const res = await updateMe({ settings: next });
      setProfile(res.user);
    } catch (e) {
      alert(e.message || 'Failed to update settings');
    }
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <p className="subtle-text">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <p className="subtle-text">Loading profile...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <p className="text-sm text-red-400">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-4 py-12">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-white">
          ←
        </Link>
        <h1 className="text-3xl font-bold text-white">Profile & Privacy</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* User Card */}
        <div className="card col-span-1 flex flex-col items-center p-6 border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm shadow-xl h-fit">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-600 text-3xl font-bold text-white shadow-lg">
            {profile.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-white text-center break-words w-full">{profile.name}</h2>
          <p className="text-brand-400 font-medium text-sm">@{profile.comradeId}</p>

          <div className="mt-6 w-full space-y-4 border-t border-slate-800 pt-6">
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-slate-400">Email</span>
              <span className="text-slate-200 break-all text-sm">{profile.email}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Status</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
              </span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="card col-span-2 p-6 border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm shadow-xl">
          <h2 className="mb-6 text-xl font-bold text-slate-100 flex items-center gap-2">
            <span className="text-lg">⚙️</span> Settings
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-xl bg-slate-800/30 p-4 border border-slate-800/50">
              <div className="pr-4">
                <h3 className="font-medium text-slate-200">Public Visibility</h3>
                <p className="text-xs text-slate-500">Allow your profile to appear in search results.</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center shrink-0">
                <input
                  type="checkbox"
                  checked={profile.settings?.isSearchable ?? true}
                  onChange={() => handleToggleSetting('isSearchable')}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500/50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-800/30 p-4 border border-slate-800/50">
              <div className="pr-4">
                <h3 className="font-medium text-slate-200">Email Discovery</h3>
                <p className="text-xs text-slate-500">Allow others to find you by email.</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center shrink-0">
                <input
                  type="checkbox"
                  checked={profile.settings?.searchableByEmail ?? true}
                  onChange={() => handleToggleSetting('searchableByEmail')}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500/50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-800/30 p-4 border border-slate-800/50">
              <div className="pr-4">
                <h3 className="font-medium text-slate-200">Online Status</h3>
                <p className="text-xs text-slate-500">Show online / last seen status.</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center shrink-0">
                <input
                  type="checkbox"
                  checked={profile.settings?.showLastSeen ?? true}
                  onChange={() => handleToggleSetting('showLastSeen')}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500/50"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6 border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm shadow-xl">
        <h2 className="mb-6 text-xl font-bold text-slate-100 flex items-center gap-2">
          <span className="text-lg">👥</span> My Friends
        </h2>
        {friends.length === 0 ? (
          <p className="text-slate-500 text-sm">No friends yet. Search for comrades on the dashboard!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map(friend => (
              <div key={friend._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                <Link to={`/profile/${friend.comradeId}`} className="flex items-center gap-3 hover:opacity-80 transition">
                  <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                    {friend.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium">{friend.name}</p>
                    <p className="text-xs text-slate-500">@{friend.comradeId}</p>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemoveFriend(friend._id)}
                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-500/20 hover:bg-red-500/10 transition"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default ProfilePage;
