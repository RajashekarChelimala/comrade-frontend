import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAllUsers, getFlags, updateFlag, getPendingUsers, approveUser, rejectUser, deleteUser, createUser } from '../../services/adminApi.js';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Shield, Users, Flag, Clock, Trash2, UserPlus, CheckCircle2,
  XCircle, LogOut, ArrowLeft, Search, ChevronRight, ToggleLeft, ToggleRight, UserCheck, UserX, Plus, X
} from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal.jsx';

function AdminDashboardPage() {
    const { user, logout, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [flags, setFlags] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', comradeId: '', password: '', role: 'user' });
    const [addLoading, setAddLoading] = useState(false);

    // Confirmation Modal state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'danger'
    });

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
            const [usersRes, flagsRes, pendingRes] = await Promise.all([
                getAllUsers(), getFlags(), getPendingUsers()
            ]);
            setUsers(usersRes.users || []);
            setFlags(flagsRes.flags || []);
            setPendingUsers(pendingRes.users || []);
        } catch (e) {
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(id) {
        try {
            await approveUser(id);
            toast.success('User approved');
            loadData();
        } catch (e) {
            toast.error('Failed to approve user');
        }
    }

    async function handleReject(id) {
        setConfirmModal({
            isOpen: true,
            title: 'Reject Registration',
            message: 'Are you sure you want to reject this registration request?',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await rejectUser(id);
                    toast.success('User registration rejected');
                    setPendingUsers(prev => prev.filter(u => u._id !== id));
                } catch (e) {
                    toast.error('Failed to reject user');
                }
            }
        });
    }

    async function handleDelete(id, name) {
        setConfirmModal({
            isOpen: true,
            title: 'Delete User',
            message: `Are you sure you want to permanently delete "${name}"? This action cannot be undone and will remove all their data.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteUser(id);
                    toast.success('User deleted');
                    setUsers(prev => prev.filter(u => u._id !== id));
                } catch (e) {
                    toast.error(e.message || 'Failed to delete user');
                }
            }
        });
    }

    async function handleCreateUser(e) {
        e.preventDefault();
        if (!newUser.name || !newUser.email || !newUser.comradeId || !newUser.password) {
            toast.error('All fields are required');
            return;
        }
        setAddLoading(true);
        try {
            await createUser(newUser);
            toast.success('User created successfully!');
            setShowAddModal(false);
            setNewUser({ name: '', email: '', comradeId: '', password: '', role: 'user' });
            loadData();
        } catch (e) {
            toast.error(e.message || 'Failed to create user');
        } finally {
            setAddLoading(false);
        }
    }

    async function handleToggleFlag(key, currentVal) {
        try {
            await updateFlag(key, !currentVal);
            setFlags(prev => {
                const existing = prev.find(f => f.key === key);
                if (existing) return prev.map(f => f.key === key ? { ...f, enabled: !currentVal } : f);
                return [...prev, { key, enabled: !currentVal }];
            });
            toast.success(`Flag updated`);
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
            enabled: dbFlag ? dbFlag.enabled : true,
            description: dbFlag?.description || 'System Feature'
        };
    });

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.comradeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tabs = [
        { id: 'users', label: 'Users', Icon: Users, count: users.length },
        { id: 'pending', label: 'Pending', Icon: Clock, count: pendingUsers.length },
        { id: 'flags', label: 'Feature Flags', Icon: Flag },
    ];

    return (
        <main className="min-h-screen bg-slate-950 text-slate-100">
            {/* Top Bar */}
            <div className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition">
                            <ArrowLeft className="h-4 w-4" /> Dashboard
                        </Link>
                        <div className="h-5 w-px bg-slate-800" />
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-brand-600/20">
                                <Shield className="h-4 w-4 text-brand-400" />
                            </div>
                            <h1 className="text-lg font-bold text-white hidden sm:block">Admin Panel</h1>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition"
                    >
                        <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
                {/* Tab Bar */}
                <div className="flex items-center gap-1 mb-6 bg-slate-900/50 p-1 rounded-xl border border-slate-800/50 overflow-x-auto">
                    {tabs.map(tab => {
                        const Icon = tab.Icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                    isActive
                                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/30'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className={`ml-1 inline-flex items-center justify-center text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full ${
                                        isActive ? 'bg-white/20 text-white' : tab.id === 'pending' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20"><div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                    <>
                        {/* ───── USERS TAB ───── */}
                        {activeTab === 'users' && (
                            <div className="animate-fadeIn">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                                    <div className="relative flex-1 w-full sm:max-w-sm">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            placeholder="Search users by name, ID, or email..."
                                            className="input pl-10 w-full"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="btn-primary flex items-center gap-2 text-sm"
                                    >
                                        <UserPlus className="h-4 w-4" /> Add User
                                    </button>
                                </div>
                                <div className="overflow-hidden rounded-xl border border-slate-800/50 bg-slate-900/40 backdrop-blur-sm shadow-xl">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-800/60">
                                                    <th className="px-4 sm:px-6 py-3.5 font-medium text-slate-400 text-xs uppercase tracking-wider">User</th>
                                                    <th className="px-4 sm:px-6 py-3.5 font-medium text-slate-400 text-xs uppercase tracking-wider hidden md:table-cell">Role</th>
                                                    <th className="px-4 sm:px-6 py-3.5 font-medium text-slate-400 text-xs uppercase tracking-wider hidden sm:table-cell">Status</th>
                                                    <th className="px-4 sm:px-6 py-3.5 font-medium text-slate-400 text-xs uppercase tracking-wider hidden lg:table-cell">Activity</th>
                                                    <th className="px-4 sm:px-6 py-3.5 font-medium text-slate-400 text-xs uppercase tracking-wider text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/40">
                                                {filteredUsers.map(u => (
                                                    <tr key={u._id} className="hover:bg-slate-800/30 transition">
                                                        <td className="px-4 sm:px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative flex-shrink-0">
                                                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shadow">
                                                                        {u.name?.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    {u.isOnline && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-slate-950" />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-medium text-slate-100 truncate">{u.name}</div>
                                                                    <div className="text-[11px] text-slate-500 font-mono truncate">@{u.comradeId}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700/50 text-slate-400'}`}>
                                                                {u.role === 'admin' && <Shield className="h-3 w-3" />}
                                                                {u.role?.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${u.status === 'active' ? 'bg-green-500/10 text-green-400' : u.status === 'pending_approval' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                                                                {u.status === 'active' && <CheckCircle2 className="h-3 w-3" />}
                                                                {u.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                                                            {u.isOnline ? (
                                                                <span className="text-green-400 text-xs font-medium">● Online</span>
                                                            ) : (
                                                                <span className="text-slate-600 text-xs">
                                                                    {u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleString() : 'Never'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 sm:px-6 py-4 text-right">
                                                            {u.role !== 'admin' && (
                                                                <button
                                                                    onClick={() => handleDelete(u._id, u.name)}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 transition group"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                                                                    <span className="hidden sm:inline">Delete</span>
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {filteredUsers.length === 0 && (
                                        <div className="py-12 text-center text-slate-500">No users match your search.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ───── PENDING TAB ───── */}
                        {activeTab === 'pending' && (
                            <div className="animate-fadeIn">
                                {pendingUsers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                        <UserCheck className="h-12 w-12 mb-4 opacity-30" />
                                        <p>No pending registrations</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {pendingUsers.map(u => (
                                            <div key={u._id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/60 transition backdrop-blur-sm">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow">
                                                        {u.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-slate-100 truncate">{u.name}</div>
                                                        <div className="text-[11px] text-slate-500 truncate">@{u.comradeId} · {u.email}</div>
                                                        <div className="text-[10px] text-slate-600 mt-0.5">{new Date(u.createdAt).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                                    <button
                                                        onClick={() => handleApprove(u._id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition"
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(u._id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition"
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ───── FLAGS TAB ───── */}
                        {activeTab === 'flags' && (
                            <div className="grid gap-3 sm:grid-cols-2 animate-fadeIn">
                                {mergedFlags.map(flag => (
                                    <div key={flag.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-slate-700/60 transition backdrop-blur-sm group">
                                        <div className="min-w-0 mr-4">
                                            <p className="font-mono text-xs text-brand-300 truncate">{flag.key.replace('FEATURE_ENABLE_', '')}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">{flag.description}</p>
                                        </div>
                                        <button
                                            onClick={() => handleToggleFlag(flag.key, flag.enabled)}
                                            className="flex-shrink-0 transition-transform hover:scale-110"
                                        >
                                            {flag.enabled ? (
                                                <ToggleRight className="h-7 w-7 text-green-400" />
                                            ) : (
                                                <ToggleLeft className="h-7 w-7 text-slate-600" />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ───── ADD USER MODAL ───── */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 animate-fadeIn">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-brand-400" /> Add New User
                            </h2>
                            <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                                <input type="text" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} className="input" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                                <input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} className="input" placeholder="john@example.com" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Comrade ID</label>
                                <input type="text" value={newUser.comradeId} onChange={e => setNewUser(p => ({ ...p, comradeId: e.target.value }))} className="input" placeholder="johndoe" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                                <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} className="input" placeholder="••••••••" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
                                <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))} className="input">
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <button type="submit" disabled={addLoading} className="btn-primary w-full py-2.5">
                                {addLoading ? 'Creating...' : 'Create User'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

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

export default AdminDashboardPage;
