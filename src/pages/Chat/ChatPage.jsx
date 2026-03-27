import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { getChat, getMessages, sendMessage, reactToMessage, removeReaction, markAsRead } from '../../services/chatApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getSocket } from '../../services/socket.js';
import {
  FileText, Clock, Check, CheckCheck, Download,
  ThumbsUp, Heart, Smile, SmilePlus, Reply,
  Trash2, MoreVertical, Paperclip, Send,
  ChevronDown, ArrowLeft, X, Lock, Mic, Square, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';

const getDownloadUrl = (url) => {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('/fl_attachment/')) {
    return url.replace('/upload/', '/upload/fl_attachment/');
  }
  return url;
};

function ChatPage() {
  const { chatId } = useParams();
  const { user, tokens, loading: authLoading } = useAuth();
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
  const [activeInChat, setActiveInChat] = useState([]);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Utility functions for timestamps and dates

  const renderTextWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-brand-200 break-all transition-colors"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

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
      setMessages((prev) => {
        // If we optimistically added it using tempId, replace it
        if (prev.find(m => m.id === payload.message.id || (payload.tempId && m.tempId === payload.tempId))) {
          return prev.map(m => (m.id === payload.message.id || (payload.tempId && m.tempId === payload.tempId)) ? payload.message : m);
        }
        return [...prev, payload.message];
      });

      // Mark as read if from others
      const isMeStr = user.id || user._id;
      const senderStr = payload.message.sender?._id || payload.message.sender;
      if (String(senderStr) !== String(isMeStr)) {
        markAsRead(chatId).catch(() => { });
      }
    }

    function handleMessagesRead(payload) {
      if (payload.chatId !== chatId) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (payload.messageIds.includes(m.id)) {
            const existing = (m.readBy || []).find(r => r.user === payload.readByUserId);
            if (!existing) {
              return { ...m, readBy: [...(m.readBy || []), { user: payload.readByUserId, readAt: payload.readAt }] };
            }
          }
          return m;
        })
      );
    }

    function handleMessageUpdated(payload) {
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m)),
      );
    }

    function handleActiveUsers(payload) {
      setActiveInChat(prev => {
        const set = new Set(payload.userIds);
        return Array.from(set);
      });
    }

    function handleUserJoined(payload) {
      setActiveInChat(prev => {
        if (prev.includes(payload.userId)) return prev;
        return [...prev, payload.userId];
      });
    }

    function handleUserLeft(payload) {
      setActiveInChat(prev => prev.filter(id => id !== payload.userId));
    }

    function handleUserStatusChange(payload) {
      setChat(prev => {
        if (!prev) return prev;
        const newParticipants = (prev.participants || []).map(p => {
          if (p._id === payload.userId || p.id === payload.userId) {
            return {
              ...p,
              isOnline: payload.isOnline,
              lastSeenAt: payload.lastSeenAt || p.lastSeenAt,
            };
          }
          return p;
        });
        return { ...prev, participants: newParticipants };
      });
    }

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:messages_read', handleMessagesRead);
    socket.on('chat:message_updated', handleMessageUpdated);
    socket.on('chat:active_users', handleActiveUsers);
    socket.on('chat:user_joined', handleUserJoined);
    socket.on('chat:user_left', handleUserLeft);
    socket.on('user_status_change', handleUserStatusChange);

    return () => {
      socket.emit('leave_chat', chatId);
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:messages_read', handleMessagesRead);
      socket.off('chat:message_updated', handleMessageUpdated);
      socket.off('chat:active_users', handleActiveUsers);
      socket.off('chat:user_joined', handleUserJoined);
      socket.off('chat:user_left', handleUserLeft);
      socket.off('user_status_change', handleUserStatusChange);
    };
  }, [chatId, tokens]);

  // Click outside to close message menu
  useEffect(() => {
    const handleCloseMenu = () => setOpenMenuForId(null);
    if (openMenuForId) {
      window.addEventListener('click', handleCloseMenu);
    }
    return () => window.removeEventListener('click', handleCloseMenu);
  }, [openMenuForId]);

  useEffect(() => {
    async function load() {
      try {
        const [chatRes, msgRes] = await Promise.all([getChat(chatId), getMessages(chatId)]);
        setChat(chatRes.chat);
        const initial = msgRes.messages || [];
        setMessages(initial);
        markAsRead(chatId).catch(() => { });
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
      setInput('');
      setReplyTo(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (e) {
      // ignore for now or show error
    }
  }

  function handleTextareaKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  function handleTextareaInput(e) {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }

  function scrollToBottom() {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
    }
  }

  // ───── Voice Recording ─────
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        clearInterval(recordingTimerRef.current);
        setRecordingDuration(0);

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size < 500) return; // too short, discard

        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        const tempUrl = URL.createObjectURL(blob);
        const tempId = `temp-voice-${Date.now()}-${Math.random()}`;

        const tempMsg = {
          id: tempId,
          tempId,
          type: 'media',
          sender: { _id: user.id || user._id, name: user.name, comradeId: user.comradeId },
          mediaUrl: tempUrl,
          mediaType: 'audio',
          fileName: file.name,
          fileSize: file.size,
          createdAt: new Date().toISOString(),
          isUploading: true,
          fileObj: file,
        };

        setMessages(prev => [...prev, tempMsg]);
        setTimeout(() => {
          if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }, 50);

        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const csrf = getCsrfToken();
        const authHeader = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};

        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch(`${baseUrl}/media/upload`, {
            method: 'POST', body: formData, credentials: 'include',
            headers: { ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...authHeader },
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.message || 'Upload failed');

          const sendRes = await sendMessage(chatId, {
            type: 'media',
            mediaUrl: data.mediaUrl,
            mediaType: data.mediaType || 'audio',
            mediaPublicId: data.mediaPublicId,
            fileName: data.fileName,
            fileSize: data.fileSize,
            tempId,
          });
          setMessages(prev => prev.map(m => m.id === tempId || m.tempId === tempId ? sendRes.message : m));
        } catch (err) {
          setMessages(prev => prev.filter(m => m.id !== tempId));
          alert(`Voice upload failed: ${err.message}`);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } catch (err) {
      toast && toast.error ? toast.error('Microphone access denied') : alert('Microphone access denied');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }

  function cancelRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  }

  function formatRecordingTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
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
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBtn(distFromBottom > 300);
  }

  function handleDoubleClickReply(m) {
    setReplyTo({
      id: m.id,
      sender: m.sender,
      type: m.type,
      content: m.type === 'text' ? m.content : null,
      mediaType: m.mediaType,
    });
  }

  const scrollToMessage = (id) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-brand-500/20');
      setTimeout(() => el.classList.remove('bg-brand-500/20'), 1500);
    }
  };

  function getCsrfToken() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('comrade_csrf');
  }

  async function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    const newMessages = files.map(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      let mediaType = 'document';
      if (isImage) mediaType = 'image';
      else if (isVideo) mediaType = 'video';
      else if (file.type.startsWith('audio/')) mediaType = 'audio';

      const tempUrl = (isImage || isVideo || mediaType === 'audio') ? URL.createObjectURL(file) : null;
      const tempId = `temp-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '')}-${Math.random()}`;

      return {
        id: tempId,
        tempId: tempId,
        type: 'media',
        sender: { _id: user.id || user._id, name: user.name, comradeId: user.comradeId },
        mediaUrl: tempUrl,
        mediaType,
        fileName: file.name,
        fileSize: file.size,
        createdAt: new Date().toISOString(),
        isUploading: true,
        fileObj: file
      };
    });

    setMessages(prev => [...prev, ...newMessages]);

    setTimeout(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    }, 50);

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const csrf = getCsrfToken();
    const authHeader = tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {};

    for (const msg of newMessages) {
      try {
        const formData = new FormData();
        formData.append('file', msg.fileObj);

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
        if (!res.ok) throw new Error(data?.message || 'Upload failed');

        const sendRes = await sendMessage(chatId, {
          type: 'media',
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          mediaPublicId: data.mediaPublicId,
          fileName: data.fileName,
          fileSize: data.fileSize,
          tempId: msg.tempId,
        });

        // The socket 'chat:new_message' will also attempt to replace it if tempId matches.
        // We can forcefully replace it here to ensure UI acts immediately.
        setMessages(prev => prev.map(m => m.id === msg.id || m.tempId === msg.id ? sendRes.message : m));

      } catch (err) {
        setMessages(prev => prev.filter(m => m.id !== msg.id));
        alert(`Failed to send ${msg.fileName}: ${err.message}`);
      }
    }
  }

  const reactionOptions = [
    { type: 'like', Icon: ThumbsUp },
    { type: 'love', Icon: Heart },
    { type: 'laugh', Icon: Smile },
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

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <p className="text-sm text-red-400">{error}</p>
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

  if (!chat) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <p className="subtle-text">Loading chat details...</p>
      </main>
    );
  }

  const other = (chat?.participants || []).find((p) => p._id !== user.id && p._id !== user._id);
  const isOtherActiveInChat = other && activeInChat.includes(other._id);

  return (
    <main className="mx-auto flex h-screen max-w-7xl flex-col overflow-hidden px-2 sm:px-4 py-3 sm:py-6">
      <header className="mb-3 flex items-center gap-3 border-b border-slate-800/60 pb-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white transition-all flex-shrink-0 backdrop-blur-sm"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {other ? other.name?.charAt(0).toUpperCase() : '?'}
            </div>
            {other?.isOnline && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-slate-950 animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-slate-50 truncate leading-tight">
              {other ? other.name : chat?.chatId}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs mt-0.5">
              {other && (
                <>
                  {isOtherActiveInChat ? (
                    <span className="text-brand-400 font-medium">In this chat</span>
                  ) : other.isOnline ? (
                    <span className="text-green-400 font-medium">Online</span>
                  ) : (
                    <span className="text-slate-500 truncate">
                      {other.lastSeenAt
                        ? `Last seen ${new Date(other.lastSeenAt).toLocaleString()}`
                        : 'Offline'}
                    </span>
                  )}
                </>
              )}
              <span className="text-slate-600 hidden sm:inline">·</span>
              <span className="text-slate-600 hidden sm:flex items-center gap-1"><Lock className="h-2.5 w-2.5" /> Encrypted</span>
            </div>
          </div>
        </div>
      </header>
      <section
        ref={messagesRef}
        onScroll={handleScroll}
        className="scrollbar-thin flex-1 overflow-y-auto rounded-2xl border border-slate-800/50 p-3 sm:p-4 relative"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.06) 0%, rgba(15,23,42,0.95) 60%, rgba(2,6,23,1) 100%)',
        }}
      >
        <div
          className="flex flex-col gap-2 sm:gap-3"
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
            const summaryTypes = reactionOptions.filter(opt => counts[opt.type] > 0);

            // Add date separator
            const showDateSeparator = index === 0 ||
              getMessageDateKey(m.createdAt) !== getMessageDateKey(messages[index - 1].createdAt);

            const statusColor = m.readBy && m.readBy.length > 0 ? "text-blue-400" : "text-slate-400";
            const renderStatusIcon = (m, isMe) => {
              if (!isMe) return null;
              if (m.isUploading) return <Clock className="h-3 w-3 text-slate-400/80 ml-1" />;
              if (m.readBy && m.readBy.length > 0) return <CheckCheck className="h-3.5 w-3.5 text-blue-400 ml-1" />;
              return <Check className="h-3.5 w-3.5 text-slate-400/80 ml-1" />;
            };

            return (
              <React.Fragment key={m.id}>
                {showDateSeparator && (
                  <div className="flex justify-center my-3 sticky top-0 z-10">
                    <div className="bg-slate-800/80 backdrop-blur-md px-4 py-1 rounded-full shadow-lg border border-slate-700/30">
                      <span className="text-[11px] text-slate-300 font-medium tracking-wide">
                        {formatDateLabel(m.createdAt)}
                      </span>
                    </div>
                  </div>
                )}
                <div id={`msg-${m.id}`} className={`flex ${isMe ? 'justify-end' : 'justify-start'} transition-colors duration-700 rounded-3xl p-1 -m-1 animate-fadeIn ${openMenuForId === m.id ? 'z-[60] relative' : 'z-0'}`}>
                  <div className="relative group max-w-[92%] sm:max-w-[85%]">
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm shadow-md transition-all duration-200 select-none ${isMe
                        ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-br-sm hover:shadow-brand-900/40 hover:shadow-lg'
                        : 'bg-slate-800/90 text-slate-50 rounded-bl-sm hover:bg-slate-700/90 hover:shadow-lg'
                        }`}
                      onClick={() => setActiveReactionId((prev) => (prev === m.id ? null : m.id))}
                      onDoubleClick={() => handleDoubleClickReply(m)}
                      onTouchStart={(e) => handleTouchStart(e, m.id)}
                    >
                      {m.replyTo && (
                        <div
                          className="mb-1 rounded-lg bg-slate-900/70 px-2 py-1 text-[11px] text-slate-300 cursor-pointer hover:bg-slate-900/90 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollToMessage(m.replyTo.id || m.replyTo._id);
                          }}
                        >
                          <p className="font-semibold text-brand-300">
                            @{m.replyTo.sender?.comradeId || m.replyTo.sender?.name || 'Unknown'}
                          </p>
                          <p className="truncate">
                            {m.replyTo.type === 'text'
                              ? (m.replyTo.content || 'Reply')
                              : m.replyTo.mediaType === 'image'
                                ? '📷 Photo'
                                : m.replyTo.mediaType === 'video'
                                  ? '🎥 Video'
                                  : '📄 Document'}
                          </p>
                        </div>
                      )}
                      <p className="mb-1 text-xs font-semibold text-slate-200">
                        {m.sender?.comradeId || 'Unknown'}
                      </p>
                      {m.type === 'text' && (
                        <div className="flex items-end gap-2">
                          <p className="flex-1 whitespace-pre-wrap">{renderTextWithLinks(m.content)}</p>
                          <span className={`text-[10px] flex items-center ${isMe ? 'text-white/70' : 'text-slate-400/70'} mt-1 flex-shrink-0`}>
                            {formatTime(m.createdAt)}
                            {renderStatusIcon(m, isMe)}
                          </span>
                        </div>
                      )}
                      {m.type === 'media' && (m.mediaUrl || m.isUploading) && (
                        <div className="mt-1 relative group/mediawrapper">
                          {m.mediaType === 'image' ? (
                            <div className="relative overflow-hidden rounded-xl">
                              <img
                                src={m.mediaUrl}
                                alt="Shared media"
                                className={`max-h-64 w-full object-cover ${m.isUploading ? 'opacity-50 blur-sm' : ''}`}
                              />
                              {m.isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="h-8 w-8 rounded-full border-4 border-slate-300 border-t-brand-400 animate-spin"></div>
                                </div>
                              )}
                              {!m.isUploading && m.mediaUrl && (
                                <a href={getDownloadUrl(m.mediaUrl)} download={m.fileName || 'media'} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 bg-slate-900/80 text-white rounded-full p-2 opacity-0 group-hover/mediawrapper:opacity-100 transition hover:bg-brand-600 z-10 shadow-lg">
                                  <Download className="h-4 w-4" />
                                </a>
                              )}
                              <div className={`absolute bottom-1 right-1 text-[10px] ${isMe ? 'text-white/90' : 'text-slate-300'} bg-black/60 px-1.5 py-0.5 rounded flex items-center`}>
                                {formatTime(m.createdAt)}
                                {renderStatusIcon(m, isMe)}
                              </div>
                            </div>
                          ) : m.mediaType === 'video' ? (
                            <div className="relative overflow-hidden rounded-xl">
                              <video
                                src={m.mediaUrl}
                                controls={!m.isUploading}
                                className={`max-h-64 w-full bg-black object-contain ${m.isUploading ? 'opacity-50 blur-sm' : ''}`}
                              />
                              {m.isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="h-8 w-8 rounded-full border-4 border-slate-300 border-t-brand-400 animate-spin"></div>
                                </div>
                              )}
                              {!m.isUploading && m.mediaUrl && (
                                <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 bg-slate-900/80 text-white rounded-full p-2 opacity-0 group-hover/mediawrapper:opacity-100 transition hover:bg-brand-600 z-10 shadow-lg">
                                  ⬇️
                                </a>
                              )}
                              <div className={`absolute bottom-1 right-1 text-[10px] ${isMe ? 'text-white/90' : 'text-slate-300'} bg-black/60 px-1.5 py-0.5 rounded flex items-center z-10`}>
                                {formatTime(m.createdAt)}
                                {renderStatusIcon(m, isMe)}
                              </div>
                            </div>
                          ) : m.mediaType === 'audio' ? (
                            // Audio / Voice message
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <audio
                                src={m.mediaUrl}
                                controls
                                className={`flex-1 h-10 ${m.isUploading ? 'opacity-50' : ''}`}
                                style={{ maxWidth: '250px', filter: 'hue-rotate(200deg) saturate(0.6) brightness(1.2)' }}
                              />
                              {m.isUploading && <Clock className="h-4 w-4 text-slate-400 animate-pulse" />}
                              <span className={`text-[10px] flex items-center ${isMe ? 'text-white/70' : 'text-slate-400/70'} flex-shrink-0`}>
                                {formatTime(m.createdAt)}
                                {renderStatusIcon(m, isMe)}
                              </span>
                            </div>
                          ) : (
                            // Document UI
                            <div className="flex flex-col">
                              <a href={m.isUploading ? undefined : getDownloadUrl(m.mediaUrl)} download={m.fileName || 'document'} target={m.isUploading ? undefined : "_blank"} rel="noopener noreferrer" className={`flex w-full min-w-[200px] items-center gap-3 rounded-lg p-3 ${isMe ? 'bg-brand-700/50 hover:bg-brand-700' : 'bg-slate-700/50 hover:bg-slate-700'} transition ${m.isUploading ? 'cursor-wait opacity-80' : 'hover:shadow-md'}`}>
                                <div className={`flex items-center justify-center p-2 rounded-lg ${isMe ? 'bg-brand-800' : 'bg-slate-800'} text-brand-300`}>
                                  <FileText className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1 hover:text-white">
                                  <span className="truncate font-medium text-sm text-slate-100">{m.fileName || 'Document'}</span>
                                  <span className="text-[11px] text-slate-300 mt-0.5">
                                    {m.fileSize ? (m.fileSize / 1024 / 1024).toFixed(2) + ' MB' : ''}
                                    {m.isUploading ? ' • Uploading...' : ''}
                                  </span>
                                </div>
                                {!m.isUploading && (
                                  <div className={`ml-2 hover:text-white shrink-0 transition p-2 rounded-full ${isMe ? 'bg-brand-800 text-brand-200' : 'bg-slate-800 text-slate-300'} hover:bg-opacity-80`}>
                                    <Download className="h-4 w-4" />
                                  </div>
                                )}
                              </a>
                              {m.isUploading && (
                                <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-brand-400 h-1.5 rounded-full animate-pulse w-full"></div>
                                </div>
                              )}
                              <div className="flex justify-end items-center mt-1">
                                <div className={`text-[10px] ${isMe ? 'text-white/80' : 'text-slate-400/80'} px-1 rounded flex items-center`}>
                                  {formatTime(m.createdAt)}
                                  {renderStatusIcon(m, isMe)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {activeReactionId === m.id && (
                        <div className="mt-1.5 flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-full shadow-md backdrop-blur-sm w-fit">
                          {reactionOptions.map((opt) => {
                            const Icon = opt.Icon;
                            return (
                              <button
                                key={opt.type}
                                type="button"
                                onClick={() => handleReactionClick(m, opt)}
                                className={`rounded-full p-1.5 transition ${myReaction && myReaction.type === opt.type ? 'text-brand-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                  }`}
                              >
                                <Icon className="h-4 w-4" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {summaryTypes.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-2 bg-slate-900/50 rounded-full px-2 py-1 w-fit border border-slate-800">
                          {summaryTypes.map(opt => {
                            const Icon = opt.Icon;
                            return (
                              <div key={opt.type} className="flex items-center gap-1 text-slate-300">
                                <Icon className="h-3 w-3" />
                                <span className="text-[10px] font-medium">{counts[opt.type]}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuForId((prev) => (prev === m.id ? null : m.id));
                      }}
                      className={`absolute ${isMe ? '-left-8' : '-right-8'} top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-400 hover:text-slate-200 p-1`}
                      aria-label="Message options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenuForId === m.id && (
                      <div className={`absolute ${isMe ? 'right-0' : 'left-0'} top-5 z-50 w-36 rounded-lg bg-slate-900 border border-slate-800 py-1 text-xs shadow-xl shadow-black/80 overflow-hidden animate-fadeIn`}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-800 transition text-slate-200"
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
                          <Reply className="h-3.5 w-3.5" />
                        </button>
                        {m.type === 'text' && (
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-800 transition text-slate-200 border-t border-slate-800/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(m.content);
                              toast.success('Message copied');
                              setOpenMenuForId(null);
                            }}
                          >
                            <span>Copy</span>
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-800 transition text-slate-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveReactionId(m.id);
                            setOpenMenuForId(null);
                          }}
                        >
                          <span>React</span>
                          <SmilePlus className="h-3.5 w-3.5" />
                        </button>
                        {/* {isMe && (
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-red-400 hover:bg-red-900/30 transition group/del"
                            onClick={(e) => {
                              e.stopPropagation();
                              alert('Delete message is not implemented yet.');
                              setOpenMenuForId(null);
                            }}
                          >
                            <span>Delete</span>
                            <Trash2 className="h-3.5 w-3.5 group-hover/del:text-red-300" />
                          </button>
                        )} */}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
        {/* Scroll-to-bottom FAB */}
        {showScrollBtn && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="sticky bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center h-10 w-10 rounded-full bg-brand-600 text-white shadow-lg shadow-brand-900/50 hover:bg-brand-500 transition-all duration-300 hover:scale-110 animate-fadeIn"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}
      </section>
      {replyTo && (
        <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-900/90 backdrop-blur-sm px-3 py-2.5 text-xs border border-slate-800/50 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-1 h-8 rounded-full bg-brand-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-brand-300 text-[11px]">
                Replying to @{replyTo.sender?.comradeId || replyTo.sender?.name || 'Unknown'}
              </p>
              <p className="max-w-xs truncate text-slate-300 text-[11px]">
                {replyTo.type === 'text'
                  ? (replyTo.content || '')
                  : replyTo.mediaType === 'image'
                    ? '📷 Photo'
                    : replyTo.mediaType === 'video'
                      ? '🎥 Video'
                      : '📄 Document'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="ml-3 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Cancel reply"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <form onSubmit={handleSend} className="mt-2 sm:mt-3 flex items-end gap-2 pb-1">
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white transition-all flex-shrink-0"
          aria-label="Attach media"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {isRecording ? (
          /* Recording UI */
          <div className="flex-1 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-2.5 animate-fadeIn">
            <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-red-400 font-mono text-sm font-medium">{formatRecordingTime(recordingDuration)}</span>
            <span className="text-red-400/60 text-xs flex-1">Recording...</span>
            <button type="button" onClick={cancelRecording} className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition" aria-label="Cancel recording">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex-1 min-w-0 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleTextareaKeyDown}
              rows={1}
              className="input w-full min-w-0 resize-none overflow-y-auto py-2.5 pr-3 pl-4 text-sm rounded-2xl leading-5"
              style={{ maxHeight: '120px' }}
              placeholder="Type a message..."
            />
          </div>
        )}

        {/* Send / Record / Stop button */}
        {isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-red-500 text-white shadow-lg shadow-red-900/30 hover:bg-red-400 transition-all flex-shrink-0 animate-pulse"
            aria-label="Stop recording"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : input.trim() ? (
          <button
            type="submit"
            className="flex items-center justify-center h-10 w-10 rounded-full bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-900/30 transition-all flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-800/80 text-slate-400 hover:bg-brand-600 hover:text-white transition-all flex-shrink-0"
            aria-label="Record voice message"
          >
            <Mic className="h-5 w-5" />
          </button>
        )}
      </form>
    </main>
  );
}

export default ChatPage;