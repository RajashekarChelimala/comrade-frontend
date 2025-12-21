import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAllUsers, getFlags, updateFlag } from '../../services/adminApi.js';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function AdminDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('flags'); // 'users' or 'flags'
    const [users, setUsers] = useState([]);
    const [flags, setFlags] = useState([]);
    const [loading, setLoading] = useState(true);

    // Default flags to ensure UI shows them even if DB is empty initially (will upsert on toggle)
    const defaultFlagKeys = [
        'FEATURE_ENABLE_REGISTRATION',
        'FEATURE_ENABLE_LOGIN',
        'FEATURE_ENABLE_CHAT',
        'FEATURE_ENABLE_REACTIONS',
        'FEATURE_ENABLE_CHAT_REQUESTS'
    ];

    useEffect(() => {
        if (!user || user.role !== 'admin') return;

        loadData();
    }, [user]);

    async function loadData() {
        try {
            setLoading(true);
            const [usersRes, flagsRes] = await Promise.all([
                getAllUsers(),
                getFlags()
            ]);
            setUsers(usersRes.users || []);
            setFlags(flagsRes.flags || []);
        } catch (e) {
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleFlag(key, currentVal) {
        try {
            const newVal = !currentVal;
            await updateFlag(key, newVal);

            // Update local state
            setFlags(prev => {
                const existing = prev.find(f => f.key === key);
                if (existing) {
                    return prev.map(f => f.key === key ? { ...f, enabled: newVal } : f);
                } else {
                    return [...prev, { key, enabled: newVal }];
                }
            });
            toast.success(`Flag ${key} updated`);
        } catch (e) {
            toast.error('Failed to update flag');
        }
    }

    if (authLoading) return null;
    if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />;

    const mergedFlags = defaultFlagKeys.map(key => {
        const dbFlag = flags.find(f => f.key === key);
        return {
            key,
            enabled: dbFlag ? dbFlag.enabled : true, // Default to true if not in DB
            description: dbFlag?.description || 'System Feature'
        };
    });

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
            <header className="mx-auto max-w-6xl mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="text-slate-400 hover:text-white">← Dashboard</Link>
                    <h1 className="text-2xl font-bold text-brand-400">Admin Control Panel</h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('flags')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'flags' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        Feature Flags
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'users' ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        User Management
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-6xl">
                {loading ? (
                    <div className="text-center py-20 subtle-text">Loading admin data...</div>
                ) : (
                    <>
                        {activeTab === 'flags' && (
                            <div className="grid gap-6 md:grid-cols-2">
                                {mergedFlags.map(flag => (
                                    <div key={flag.key} className="flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-800/50">
                                        <div>
                                            <p className="font-mono text-sm text-brand-200">{flag.key}</p>
                                            <p className="text-xs text-slate-500 mt-1">{flag.description}</p>
                                        </div>
                                        <label className="relative inline-flex cursor-pointer items-center shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={flag.enabled}
                                                onChange={() => handleToggleFlag(flag.key, flag.enabled)}
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500/50"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-slate-800 text-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">User</th>
                                            <th className="px-6 py-3 font-medium">Role</th>
                                            <th className="px-6 py-3 font-medium">Status</th>
                                            <th className="px-6 py-3 font-medium">Joined</th>
                                            <th className="px-6 py-3 font-medium">Activity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {users.map(u => (
                                            <tr key={u._id} className="hover:bg-slate-800/30">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-200">{u.name}</div>
                                                    <div className="text-xs opacity-70">@{u.comradeId}</div>
                                                    <div className="text-xs opacity-50">{u.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-300'}`}>
                                                        {u.role.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs ${u.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                        {u.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {u.isOnline ? (
                                                        <span className="text-green-400 font-medium">Online</span>
                                                    ) : (
                                                        <span className="text-slate-600">
                                                            {u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleString() : 'Never'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}

export default AdminDashboardPage;
