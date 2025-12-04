import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getChat, getMessages, sendMessage, reactToMessage, removeReaction } from '../../services/chatApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getSocket } from '../../services/socket.js';

function ChatPage() {
  const { chatId } = useParams();
  const { user, tokens } = useAuth();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const messagesRef = useRef(null);
  const oldestTimestampRef = useRef(null);
  const fileInputRef = useRef(null);
  const [activeReactionId, setActiveReactionId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [openMenuForId, setOpenMenuForId] = useState(null);
  const [swipeStartX, setSwipeStartX] = useState(null);
  const [swipeMessageId, setSwipeMessageId] = useState(null);

  // Utility functions for timestamps and dates
  const formatTime = useCallback((timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  const formatDateLabel = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short', 
        day: 'numeric' 
      });
    }
  }, []);

  const getMessageDateKey = useCallback((timestamp) => {
    const date = new Date(timestamp);
    return date.toDateString();
  }, []);

  // Swipe handlers
  const handleTouchStart = useCallback((e, messageId) => {
    setSwipeStartX(e.touches[0].clientX);
    setSwipeMessageId(messageId);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!swipeStartX || !swipeMessageId) return;
    
    const currentX = e.touches[0].clientX;
    const diffX = currentX - swipeStartX;
    
    // Swipe right to reply (for messages from others)
    if (diffX > 50) {
      const message = messages.find(m => m.id === swipeMessageId);
      if (message && message.sender?._id !== user.id && message.sender?._id !== user._id) {
        setReplyTo({
          id: message.id,
          sender: message.sender,
          type: message.type,
          content: message.type === 'text' ? message.content : null,
          mediaType: message.mediaType,
        });
      }
      setSwipeStartX(null);
      setSwipeMessageId(null);
    }
  }, [swipeStartX, swipeMessageId, messages, user.id, user._id]);

  const handleTouchEnd = useCallback(() => {
    setSwipeStartX(null);
    setSwipeMessageId(null);
  }, []);

  useEffect(() => {
    if (!tokens?.accessToken) return;

    const socket = getSocket(tokens.accessToken);
    socket.emit('join_chat', chatId);

    function handleNewMessage(payload) {
      if (payload.chatId !== chatId) return;
      setMessages((prev) => [...prev, payload.message]);
    }

    function handleMessageUpdated(payload) {
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m)),
      );
    }

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:message_updated', handleMessageUpdated);

    return () => {
      socket.emit('leave_chat', chatId);
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:message_updated', handleMessageUpdated);
    };
  }, [chatId, tokens]);

  useEffect(() => {
    async function load() {
      try {
        const [chatRes, msgRes] = await Promise.all([getChat(chatId), getMessages(chatId)]);
        setChat(chatRes.chat);
        const initial = msgRes.messages || [];
        setMessages(initial);
        if (initial.length > 0) {
          oldestTimestampRef.current = initial[0].createdAt;
          setHasMore(initial.length >= 30);
          // scroll to bottom on first load like typical chat apps
          requestAnimationFrame(() => {
            if (messagesRef.current) {
              messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
            }
          });
        } else {
          setHasMore(false);
        }
      } catch (e) {
        setError(e.message || 'Failed to load chat');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [chatId]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      await sendMessage(chatId, {
        type: 'text',
        text: input.trim(),
        replyTo: replyTo ? replyTo.id : undefined,
      });
      // Message will arrive via socket 'chat:new_message' event
      setInput('');
      setReplyTo(null);
    } catch (e) {
      // ignore for now or show error
    }
  }

  async function loadMoreMessages() {
    if (!hasMore || isLoadingMore || !oldestTimestampRef.current) return;
    setIsLoadingMore(true);
    try {
      const container = messagesRef.current;
      const prevScrollHeight = container ? container.scrollHeight : 0;

      const res = await getMessages(chatId, { before: oldestTimestampRef.current, limit: 30 });
      const older = res.messages || [];
      if (older.length === 0) {
        setHasMore(false);
        setIsLoadingMore(false);
        return;
      }

      setMessages((prev) => [...older, ...prev]);
      oldestTimestampRef.current = older[0].createdAt;
      if (older.length < 30) setHasMore(false);

      // preserve scroll position
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - prevScrollHeight;
        }
      });
    } catch (e) {
      // ignore errors for load more
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleScroll(e) {
    const container = e.currentTarget;
    if (container.scrollTop < 80) {
      loadMoreMessages();
    }
  }

  function getCsrfToken() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('comrade_csrf');
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const formData = new FormData();
      formData.append('file', file);

      const csrf = getCsrfToken();
      const authHeader = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};

      const res = await fetch(`${baseUrl}/media/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
          ...authHeader,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Upload failed');
      }

      await sendMessage(chatId, {
        type: 'media',
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        mediaPublicId: data.mediaPublicId,
      });
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err.message || 'Failed to send media');
    } finally {
      if (fileInputRef.current) {
        // reset selection
        // eslint-disable-next-line no-param-reassign
        fileInputRef.current.value = '';
      }
    }
  }

  const reactionOptions = [
    { emoji: '👍', type: 'like' },
    { emoji: '❤️', type: 'love' },
    { emoji: '😂', type: 'laugh' },
  ];

  async function handleReactionClick(message, option) {
    const myId = user.id || user._id;
    const existing = (message.reactions || []).find(
      (r) => r.user === myId || r.user?._id === myId,
    );

    try {
      if (existing && existing.type === option.type) {
        await removeReaction(message.id);
      } else {
        await reactToMessage(message.id, option.type);
      }
    } catch (e) {
      // ignore for now
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="card px-8 py-10 text-center">
          <p className="subtle-text">You must be logged in to view this chat.</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <p className="subtle-text">Loading chat...</p>
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

  const other = (chat.participants || []).find((p) => p._id !== user.id && p._id !== user._id);

  return (
    <main className="mx-auto flex h-screen max-w-5xl flex-col overflow-hidden px-4 py-6">
      <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">
            Chat with {other ? `${other.name} (${other.comradeHandle})` : chat.chatId}
          </h1>
          <p className="subtle-text text-xs">Messages are end-to-end encrypted and temporary for media.</p>
        </div>
      </header>
      <section
        ref={messagesRef}
        onScroll={handleScroll}
        className="scrollbar-thin flex-1 overflow-y-auto rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4"
      >
        <div 
          className="flex flex-col gap-3"
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {messages.map((m, index) => {
            const isMe = m.sender && (m.sender._id === user.id || m.sender._id === user._id);
            const myId = user.id || user._id;
            const myReaction = (m.reactions || []).find(
              (r) => r.user === myId || r.user?._id === myId,
            );
            const counts = {};
            (m.reactions || []).forEach((r) => {
              counts[r.type] = (counts[r.type] || 0) + 1;
            });
            const summary = reactionOptions
              .map((opt) => (counts[opt.type] ? `${opt.emoji}${counts[opt.type]}` : null))
              .filter(Boolean)
              .join(' ');
            
            // Add date separator
            const showDateSeparator = index === 0 || 
              getMessageDateKey(m.createdAt) !== getMessageDateKey(messages[index - 1].createdAt);
            
            return (
              <React.Fragment key={m.id}>
                {showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <div className="bg-slate-800/60 px-3 py-1 rounded-full">
                      <span className="text-xs text-slate-300 font-medium">
                        {formatDateLabel(m.createdAt)}
                      </span>
                    </div>
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className="relative group max-w-[70%]">
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm shadow-sm transition-all duration-200 ${
                        isMe
                          ? 'bg-brand-600 text-white rounded-br-sm hover:bg-brand-700'
                          : 'bg-slate-800/80 text-slate-50 rounded-bl-sm hover:bg-slate-700/80'
                      }`}
                      onClick={() => setActiveReactionId((prev) => (prev === m.id ? null : m.id))}
                      onTouchStart={(e) => handleTouchStart(e, m.id)}
                    >
                      {m.replyTo && (
                        <div className="mb-1 rounded-lg bg-slate-900/70 px-2 py-1 text-[11px] text-slate-300">
                          <p className="font-semibold text-brand-300">
                            @{m.replyTo.sender?.comradeHandle || m.replyTo.sender?.name || 'Unknown'}
                          </p>
                          <p className="truncate">
                            {m.replyTo.type === 'text'
                              ? m.replyTo.content || 'Reply'
                              : m.replyTo.mediaType === 'image'
                                ? '📷 Photo'
                                : '🎥 Video'}
                          </p>
                        </div>
                      )}
                      <p className="mb-1 text-xs font-semibold text-slate-200">
                        {m.sender?.comradeHandle || 'Unknown'}
                      </p>
                      {m.type === 'text' && (
                        <div className="flex items-end gap-2">
                          <p className="flex-1">{m.content}</p>
                          <span className={`text-[10px] ${isMe ? 'text-white/70' : 'text-slate-400/70'} mt-1`}>
                            {formatTime(m.createdAt)}
                          </span>
                        </div>
                      )}
                      {m.type === 'media' && m.mediaUrl && (
                        <div className="mt-1">
                          {m.mediaType === 'image' ? (
                            <div className="relative">
                              <img
                                src={m.mediaUrl}
                                alt="Shared media"
                                className="max-h-64 w-full rounded-xl object-cover"
                              />
                              <span className={`absolute bottom-1 right-1 text-[10px] ${isMe ? 'text-white/80' : 'text-slate-400/80'} bg-black/50 px-1 rounded`}>
                                {formatTime(m.createdAt)}
                              </span>
                            </div>
                          ) : (
                            <div className="relative">
                              <video
                                src={m.mediaUrl}
                                controls
                                className="max-h-64 w-full rounded-xl bg-black object-contain"
                              />
                              <span className={`absolute bottom-1 right-1 text-[10px] ${isMe ? 'text-white/80' : 'text-slate-400/80'} bg-black/50 px-1 rounded`}>
                                {formatTime(m.createdAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {activeReactionId === m.id && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-200/80">
                          {reactionOptions.map((opt) => (
                            <button
                              key={opt.type}
                              type="button"
                              onClick={() => handleReactionClick(m, opt)}
                              className={`rounded-full px-1 hover:bg-slate-900/60 ${
                                myReaction && myReaction.type === opt.type ? 'bg-slate-900/80' : ''
                              }`}
                            >
                              {opt.emoji}
                            </button>
                          ))}
                        </div>
                      )}
                      {summary && (
                        <p className="mt-1 text-[11px] text-slate-400">{summary}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuForId((prev) => (prev === m.id ? null : m.id));
                      }}
                      className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs text-slate-400 hover:text-slate-200 p-1"
                      aria-label="Message options"
                    >
                      ⋮
                    </button>
                    {openMenuForId === m.id && (
                      <div className="absolute right--0.5 top-5 z-10 w-32 rounded-lg bg-slate-900/95 py-1 text-xs shadow-lg shadow-black/50">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-slate-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplyTo({
                              id: m.id,
                              sender: m.sender,
                              type: m.type,
                              content: m.type === 'text' ? m.content : null,
                              mediaType: m.mediaType,
                            });
                            setOpenMenuForId(null);
                          }}
                        >
                          <span>Reply</span>
                          <span>↩</span>
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-slate-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveReactionId(m.id);
                            setOpenMenuForId(null);
                          }}
                        >
                          <span>Add reaction</span>
                          <span>😊</span>
                        </button>
                        {/* <button
                          type="button"
                          className="flex w-full items-center justify-between px-2 py-1 text-left hover:bg-slate-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Placeholder for future edit implementation
                            // eslint-disable-next-line no-alert
                            alert('Edit message is not implemented yet.');
                            setOpenMenuForId(null);
                          }}
                        >
                          <span>Edit</span>
                          <span>✎</span>
                        </button> */}
                        {isMe && (
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-2 py-1 text-left text-red-300 hover:bg-red-900/40"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Placeholder for future delete implementation
                              // eslint-disable-next-line no-alert
                              alert('Delete message is not implemented yet.');
                              setOpenMenuForId(null);
                            }}
                          >
                            <span>Delete</span>
                            <span>🗑</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </section>
      {replyTo && (
        <div className="mt-3 flex items-start justify-between rounded-lg bg-slate-900/80 px-3 py-2 text-xs">
          <div>
            <p className="font-semibold text-brand-300">
              Replying to @{replyTo.sender?.comradeHandle || replyTo.sender?.name || 'Unknown'}
            </p>
            <p className="max-w-xs truncate text-slate-200">
              {replyTo.type === 'text'
                ? replyTo.content || ''
                : replyTo.mediaType === 'image'
                  ? '📷 Photo'
                  : '🎥 Video'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="ml-3 text-slate-400 hover:text-slate-200"
            aria-label="Cancel reply"
          >
            ✕
          </button>
        </div>
      )}
      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary px-3 py-2 text-sm"
          aria-label="Attach media"
        >
          <span className="mr-1">📎</span>
          <span className="hidden sm:inline">Media</span>
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="input flex-1"
          placeholder="Type a message"
        />
        <button type="submit" className="btn-primary px-4 py-2 text-sm">
          Send
        </button>
      </form>
    </main>
  );
}

export default ChatPage;