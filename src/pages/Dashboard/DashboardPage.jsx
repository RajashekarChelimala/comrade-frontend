import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getChats } from '../../services/chatApi.js';
import { getIncomingRequests, getOutgoingRequests, acceptRequest, rejectRequest, sendRequest } from '../../services/requestApi.js';
import { searchUsers, blockUser, reportUser } from '../../services/userApi.js';

function DashboardPage() {
  const { user, logout } = useAuth();
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
      alert('Request sent');
    } catch (e) {
      alert(e.message || 'Failed to send request');
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

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="card px-8 py-10 text-center">
          <h1 className="mb-2 text-2xl font-semibold text-slate-50">Comrade</h1>
          <p className="subtle-text mb-4">You are not logged in.</p>
          <Link
            to="/login"
            className="btn-primary inline-flex items-center justify-center px-6 py-2 text-sm font-semibold"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Comrade Dashboard</h1>
          <p className="subtle-text mt-1">
            Logged in as {user.name} ({user.comradeHandle}) – ID: {user.comradeId}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/profile" className="text-sm text-slate-300 hover:text-slate-100">
            Profile &amp; Settings
          </Link>
          <button type="button" onClick={logout} className="btn-primary px-3 py-2 text-sm">
            Logout
          </button>
        </div>
      </header>

      {loading && <p className="subtle-text">Loading...</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card col-span-2 px-6 py-5">
          <h2 className="section-title">Find Comrades</h2>
          <form onSubmit={handleSearch} className="mt-2 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by handle, name, or ID"
              className="input flex-1"
            />
            <button type="submit" disabled={searchLoading} className="btn-primary px-4 py-2 text-sm">
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
          {searchError && <p className="mt-2 text-sm text-red-400">{searchError}</p>}
          <ul className="mt-4 space-y-2 text-sm">
            {searchResults.map((u) => (
              <li
                key={u._id}
                className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2"
              >
                <div>
                  <p className="text-slate-100">
                    {u.name} <span className="text-slate-400">({u.comradeHandle})</span>
                  </p>
                  <p className="text-xs text-slate-500">ID: {u.comradeId}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendRequest(u._id)}
                    className="btn-primary px-3 py-1 text-xs"
                  >
                    Send Request
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBlock(u._id)}
                    className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    Block
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReport(u._id)}
                    className="rounded-lg border border-red-500/50 px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Report
                  </button>
                </div>
              </li>
            ))}
            {searchResults.length === 0 && !searchLoading && (
              <li className="subtle-text mt-2">Search by handle, name, or Comrade ID to find people.</li>
            )}
          </ul>
        </section>

        <section className="card px-6 py-5">
          <h2 className="section-title">Recent Chats</h2>
          {chats.length === 0 && <p className="subtle-text">No chats yet.</p>}
          <ul className="mt-3 space-y-2 text-sm">
            {chats.map((chat) => {
              const other = (chat.participants || []).find((p) => p._id !== user.id && p._id !== user._id);
              return (
                <li key={chat.chatId}>
                  <Link
                    to={`/chat/${chat.chatId}`}
                    className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2 hover:border-brand-500/70"
                  >
                    <span className="text-slate-100">
                      {other ? `${other.name} (${other.comradeHandle})` : chat.chatId}
                    </span>
                    <span className="text-xs text-slate-500">
                      {chat.lastMessagePreview || 'No messages yet'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card px-6 py-5">
          <h2 className="section-title">Incoming Requests</h2>
          {incoming.length === 0 && <p className="subtle-text">No incoming requests.</p>}
          <ul className="mt-3 space-y-2 text-sm">
            {incoming.map((r) => (
              <li
                key={r._id}
                className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2"
              >
                <span className="text-slate-100">
                  {r.sender?.name} <span className="text-slate-400">({r.sender?.comradeHandle})</span>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAccept(r._id)}
                    className="btn-primary px-3 py-1 text-xs"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(r._id)}
                    className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card px-6 py-5">
          <h2 className="section-title">Outgoing Requests</h2>
          {outgoing.length === 0 && <p className="subtle-text">No outgoing requests.</p>}
          <ul className="mt-3 space-y-2 text-sm">
            {outgoing.map((r) => (
              <li
                key={r._id}
                className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-2"
              >
                <span className="text-slate-100">
                  To {r.recipient?.name} ({r.recipient?.comradeHandle})
                </span>
                <span className="text-xs text-slate-500">{r.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

export default DashboardPage;
