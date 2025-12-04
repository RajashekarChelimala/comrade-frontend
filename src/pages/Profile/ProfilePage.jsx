import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMe, updateMe } from '../../services/userApi.js';

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getMe();
        setProfile(res.user);
      } catch (e) {
        setError(e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleToggleSetting(key) {
    const next = {
      ...profile.settings,
      [key]: !profile.settings?.[key],
    };
    try {
      const res = await updateMe({ settings: next });
      setProfile(res.user);
    } catch (e) {
      alert(e.message || 'Failed to update settings');
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="card px-8 py-10 text-center">
          <p className="subtle-text">You must be logged in.</p>
        </div>
      </main>
    );
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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-50">Profile &amp; Privacy</h1>
      <section className="card px-6 py-5">
        <h2 className="section-title">Account</h2>
        <div className="mt-2 space-y-1 text-sm text-slate-100">
          <p>
            <span className="font-semibold text-slate-300">Name:</span> {profile.name}
          </p>
          <p>
            <span className="font-semibold text-slate-300">Email:</span> {profile.email}
          </p>
          <p>
            <span className="font-semibold text-slate-300">Comrade Handle:</span> {profile.comradeHandle}
          </p>
          <p>
            <span className="font-semibold text-slate-300">Comrade ID:</span> {profile.comradeId}
          </p>
        </div>
      </section>

      <section className="card px-6 py-5">
        <h2 className="section-title">Privacy Settings</h2>
        <div className="mt-2 space-y-3 text-sm text-slate-100">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={profile.settings?.searchableByEmail}
              onChange={() => handleToggleSetting('searchableByEmail')}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500"
            />
            <span>Allow others to find me by email</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={profile.settings?.showLastSeen}
              onChange={() => handleToggleSetting('showLastSeen')}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500"
            />
            <span>Show my last seen / online status</span>
          </label>
        </div>
      </section>
    </main>
  );
}

export default ProfilePage;
