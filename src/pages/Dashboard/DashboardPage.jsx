import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getChats } from '../../services/chatApi.js';
import { getIncomingRequests, getOutgoingRequests, acceptRequest, rejectRequest, sendRequest } from '../../services/requestApi.js';
import { searchUsers, blockUser, reportUser } from '../../services/userApi.js';
import { Search, UserPlus, Users, CheckCircle2, Clock, Settings, LogOut, MessageCircle, ChevronRight } from 'lucide-react';

function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const [chats, setChats] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [chatsRes, incomingRes, outgoingRes] = await Promise.all([
          getChats(),
          getIncomingRequests(),
          getOutgoingRequests(),
        ]);
        setChats(chatsRes.chats || []);
        setIncoming(incomingRes.requests || []);
        setOutgoing(outgoingRes.requests || []);
      } catch (e) {
        setError(e.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleAccept(id) {
    await acceptRequest(id);
    setIncoming((prev) => prev.filter((r) => r._id !== id));
  }

  async function handleReject(id) {
    await rejectRequest(id);
    setIncoming((prev) => prev.filter((r) => r._id !== id));
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchError(null);
    setSearchLoading(true);
    try {
      const res = await searchUsers({ query: searchQuery.trim() });
      setSearchResults(res.users || []);
    } catch (e) {
      setSearchError(e.message || 'Search failed');
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleSendRequest(userId) {
    try {
      await sendRequest(userId);
      toast.success('Friend request sent!');

      // Update local search results state to reflect change immediately
      setSearchResults(prev => prev.map(u =>
        u._id === userId ? { ...u, relationship: 'SENT' } : u
      ));
    } catch (e) {
      toast.error(e.message || 'Failed to send request');
    }
  }

  async function handleBlock(userId) {
    try {
      await blockUser(userId);
      alert('User blocked');
    } catch (e) {
      alert(e.message || 'Failed to block user');
    }
  }

  async function handleReport(userId) {
    const reason = window.prompt('Reason for reporting this user?');
    if (!reason) return;
    try {
      await reportUser(userId, reason);
      alert('User reported');
    } catch (e) {
      alert(e.message || 'Failed to report user');
    }
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <p className="subtle-text">Loading authentication...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 lg:px-8">
      <header className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 shadow-xl sm:flex-row sm:items-center sm:justify-between border border-slate-700/50">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Comrade Dashboard</h1>
          <p className="mt-2 text-slate-400 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Logged in as <span className="font-semibold text-slate-200">{user.name}</span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400 border border-slate-700">#{user.comradeId}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/profile" className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white border border-slate-700">
            <Settings className="h-4 w-4" /> Profile & Settings
          </Link>
          <button type="button" onClick={logout} className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20 border border-red-500/20">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </header>

      {loading && <p className="subtle-text">Loading...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="card col-span-2 flex flex-col gap-4 border border-slate-800/60 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Search className="h-5 w-5 text-brand-400" /> Find Comrades
            </h2>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or Comrade ID..."
                className="input w-full pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            </div>
            <button type="submit" disabled={searchLoading} className="btn-primary px-6">
              {searchLoading ? '...' : 'Search'}
            </button>
          </form>

          {searchError && <p className="text-sm text-red-400">{searchError}</p>}

          <ul className="space-y-3">
            {searchResults.map((u) => {
              const relation = u.relationship || 'NONE'; // NONE, SENT, RECEIVED, FRIEND
              return (
                <li
                  key={u._id}
                  className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/40 p-3 transition hover:border-slate-600 hover:bg-slate-800/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-lg font-bold text-slate-300">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-100">{u.name}</p>
                      <p className="text-xs text-slate-500 font-mono">@{u.comradeId}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {relation === 'NONE' && (
                      <button
                        type="button"
                        onClick={() => handleSendRequest(u._id)}
                        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-brand-500"
                      >
                        Add Friend
                      </button>
                    )}
                    {relation === 'SENT' && (
                      <button
                        disabled
                        className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed border border-slate-700"
                      >
                        Request Sent
                      </button>
                    )}
                    {relation === 'RECEIVED' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(u.requestId)}
                          className="rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xs font-medium text-emerald-400 border border-emerald-600/20 hover:bg-emerald-600/30"
                        >
                          Accept
                        </button>
                      </div>
                    )}
                    {relation === 'FRIEND' && (
                      <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                        Friend
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
            {searchResults.length === 0 && !searchLoading && (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 opacity-60">
                <Users className="h-10 w-10 mb-2 opacity-40" />
                <p className="text-sm">Search people to connect</p>
              </div>
            )}
          </ul>
        </section>

        <section className="card flex flex-col gap-4 border border-slate-800/60 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl">
          <h2 className="text-xl font-bold text-slate-100">Recent Chats</h2>
          {chats.length === 0 && <p className="subtle-text">No chats yet.</p>}
          <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
            {chats.map((chat) => {
              const otherParticipant = (chat.participants || []).find(
                (p) => String(p.user?._id || p.user) !== String(user.id || user._id)
              );
              const other = otherParticipant?.user;

              return (
                <li key={chat.chatId}>
                  <Link
                    to={`/chat/${chat.chatId}`}
                    className="flex items-center gap-3 rounded-xl border border-transparent bg-slate-800/30 p-3 transition hover:border-slate-700 hover:bg-slate-800/60"
                  >
                    <div className="relative h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold shadow">
                      {other?.name ? other.name.charAt(0).toUpperCase() : <MessageCircle className="h-4 w-4" />}
                      {other?.isOnline && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-slate-950" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-baseline">
                        <span className="truncate font-medium text-slate-100">
                          {other?.name || chat.chatId}
                        </span>
                        {chat.unreadCount > 0 && (
                          <span className="h-5 min-w-[20px] px-1 bg-brand-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-lg border border-slate-900 animate-pulse">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-400">
                        {chat.lastMessagePreview || 'No messages yet'}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="card border border-slate-800/60 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Incoming Requests</h2>
          {incoming.length === 0 && <p className="subtle-text text-sm">No pending requests.</p>}
          <ul className="space-y-3">
            {incoming.map((r) => (
              <li
                key={r._id}
                className="flex items-center justify-between rounded-lg bg-slate-800/30 p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-700"></div>
                  <div className="text-sm">
                    <p className="text-slate-200 font-medium">{r.sender?.name}</p>
                    <p className="text-xs text-slate-500">@{r.sender?.comradeId}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAccept(r._id)}
                    className="rounded-lg bg-emerald-600/20 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-600/20 hover:bg-emerald-600/30"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(r._id)}
                    className="rounded-lg bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/20"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card border border-slate-800/60 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Outgoing Requests</h2>
          {outgoing.length === 0 && <p className="subtle-text text-sm">No outgoing requests.</p>}
          <ul className="space-y-3">
            {outgoing.map((r) => (
              <li
                key={r._id}
                className="flex items-center justify-between rounded-lg bg-slate-800/30 p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs opacity-50">?</div>
                  <span className="text-sm text-slate-300">
                    To <span className="text-white font-medium">{r.recipient?.name}</span>
                  </span>
                </div>
                <span className="rounded-full bg-slate-700/50 px-2 py-1 text-[10px] uppercase tracking-wider text-slate-400">{r.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

export default DashboardPage;
