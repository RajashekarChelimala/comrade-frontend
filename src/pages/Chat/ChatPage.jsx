import React, { useEffect, useRef, useState, useCallback } from 'react';
import { apiClient } from '../../services/apiClient.js';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { 
  getChat, getMessages, sendMessage, editMessage, 
  reactToMessage, removeReaction, markAsRead,
  saveAsMemory, convertToTask, updateChatSettings,
  deleteMessage
} from '../../services/chatApi.js';
import { updateMood } from '../../services/userApi.js';
import { uploadMedia } from '../../services/mediaApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getSocket } from '../../services/socket.js';
import toast from 'react-hot-toast';

// Modular Components
import { ChatHeader } from '../../components/Chat/ChatHeader';
import { MessageList } from '../../components/Chat/MessageList';
import { MessageInput } from '../../components/Chat/MessageInput';
import { MemoryPanel } from '../../components/Chat/MemoryPanel';
import { TaskPanel } from '../../components/Chat/TaskPanel';

const getDownloadUrl = (url) => {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('/fl_attachment/')) {
    return url.replace('/upload/', '/upload/fl_attachment/');
  }
  return url;
};

function ChatPage() {
  const { chatId } = useParams();
  const { user: currentUser, tokens, loading: authLoading, setUser } = useAuth();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI Panels
  const [isMemoriesOpen, setIsMemoriesOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  
  // Chat State
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeInChat, setActiveInChat] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  
  const oldestTimestampRef = useRef(null);
  const navigate = useNavigate();

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // ───── SOCKET EVENTS ─────
  useEffect(() => {
    if (!tokens?.accessToken) return;

    const socket = getSocket(tokens.accessToken);
    socket.emit('join_chat', chatId);

    const handleNewMessage = (payload) => {
      if (payload.chatId !== chatId) return;
      setMessages((prev) => {
        const msg = payload.message;
        const exists = prev.find(m => m.id === msg.id || (msg.tempId && m.tempId === msg.tempId));
        if (exists) {
          return prev.map(m => (m.id === msg.id || (msg.tempId && m.tempId === msg.tempId)) ? msg : m);
        }
        return [...prev, msg];
      });

      const myId = currentUser.id || currentUser._id;
      const senderId = payload.message.sender?._id || payload.message.sender;
      if (String(senderId) !== String(myId)) {
        markAsRead(chatId).catch(() => {});
      }
    };

    const handleUpdated = (payload) => {
      setMessages((prev) => prev.map((m) => m.id === payload.messageId ? { ...m, ...payload } : m));
    };

    const handleActive = (payload) => setActiveInChat(payload.userIds);
    const handleJoined = (payload) => setActiveInChat(prev => [...new Set([...prev, payload.userId])]);
    const handleLeft = (payload) => setActiveInChat(prev => prev.filter(id => id !== payload.userId));

    const handleRead = (payload) => {
      if (payload.chatId !== chatId) return;
      setMessages((prev) => prev.map((m) => {
        if (payload.messageIds.includes(m.id || m._id)) {
          const alreadyRead = m.readBy?.some(r => r.user === payload.readByUserId);
          if (!alreadyRead) {
            return { ...m, readBy: [...(m.readBy || []), { user: payload.readByUserId, readAt: payload.readAt }] };
          }
        }
        return m;
      }));
    };

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:message_updated', handleUpdated);
    socket.on('chat:messages_read', handleRead);
    socket.on('chat:active_users', handleActive);
    socket.on('chat:user_joined', handleJoined);
    socket.on('chat:user_left', handleLeft);

    return () => {
      socket.emit('leave_chat', chatId);
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:message_updated', handleUpdated);
      socket.off('chat:active_users', handleActive);
      socket.off('chat:user_joined', handleJoined);
      socket.off('chat:user_left', handleLeft);
    };
  }, [chatId, tokens, currentUser]);

  // ───── INITIAL LOAD ─────
  useEffect(() => {
    async function load() {
      try {
        const [chatRes, msgRes] = await Promise.all([getChat(chatId), getMessages(chatId)]);
        setChat(chatRes.chat);
        const msgs = msgRes.messages || [];
        setMessages(msgs);
        if (msgs.length > 0) {
          oldestTimestampRef.current = msgs[0].createdAt;
          setHasMore(msgs.length >= 30);
        } else {
          setHasMore(false);
        }
        markAsRead(chatId).catch(() => {});
      } catch (e) {
        setError(e.message || 'Failed to load chat');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [chatId]);

  // ───── ACTIONS ─────
  const handleSend = async (payload) => {
    try {
      const res = await sendMessage(chatId, { ...payload, replyTo: replyTo?.id });
      setReplyTo(null);
      if (payload.isScheduled) {
        setMessages(prev => {
          if (prev.find(m => m.id === res.message.id)) return prev;
          return [...prev, res.message];
        });
      }
    } catch (e) {
      toast.error('Failed to send message');
    }
  };

  const handleEditMessage = async (msg, newText) => {
    if (newText === msg.content) return;
    try {
      await editMessage(msg.id || msg._id, newText);
      toast.success('Message updated');
    } catch (e) {
      toast.error('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (msg) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await deleteMessage(msg.id || msg._id);
      toast.success('Message deleted');
    } catch (e) {
      toast.error('Failed to delete message');
    }
  };

  const handleUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.onchange = async (e) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const tempUrl = URL.createObjectURL(file);
        const mediaType = file.type.split('/')[0];

        const tempMessage = {
          _id: tempId,
          tempId,
          sender: currentUser,
          type: 'media',
          mediaUrl: tempUrl,
          mediaType,
          fileName: file.name,
          fileSize: file.size,
          isUploading: true,
          createdAt: new Date().toISOString(),
        };

        setMessages(prev => [...prev, tempMessage]);

        try {
          const data = await uploadMedia(file);
          const res = await sendMessage(chatId, {
            type: 'media',
            mediaUrl: data.mediaUrl,
            mediaType: data.mediaType,
            fileName: data.fileName,
            fileSize: data.fileSize,
            tempId,
          });
          
          URL.revokeObjectURL(tempUrl);
          setMessages(prev => {
            // Find if a message with this tempId exists
            const tempExists = prev.some(m => m.tempId === tempId);
            if (!tempExists) return prev; // Already handled or something else

            return prev.map(m => {
              if (m.tempId === tempId) {
                // Return server version, but ensure we don't duplicate if socket already updated it
                return res.message;
              }
              return m;
            });
          });
        } catch (err) {
          toast.error(`Upload failed: ${file.name}`);
          setMessages(prev => prev.filter(m => m.tempId !== tempId));
          URL.revokeObjectURL(tempUrl);
        }
      }
    };
    fileInput.click();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        
        const tempId = `voice-${Date.now()}`;
        const tempUrl = URL.createObjectURL(file);
        
        const tempMessage = {
          _id: tempId,
          tempId,
          sender: currentUser,
          type: 'voice',
          mediaUrl: tempUrl,
          mediaType: 'audio',
          isUploading: true,
          createdAt: new Date().toISOString(),
        };

        setMessages(prev => [...prev, tempMessage]);

        try {
          const data = await uploadMedia(file);
          const res = await sendMessage(chatId, {
            type: 'voice',
            mediaUrl: data.mediaUrl,
            mediaType: 'audio',
            fileName: data.fileName,
            fileSize: data.fileSize,
            tempId,
          });
          
          URL.revokeObjectURL(tempUrl);
          setMessages(prev => {
            if (!prev.some(m => m.tempId === tempId)) return prev;
            return prev.map(m => m.tempId === tempId ? res.message : m);
          });
        } catch (err) {
          toast.error('Voice upload failed');
          setMessages(prev => prev.filter(m => m.tempId !== tempId));
          URL.revokeObjectURL(tempUrl);
          console.error(err);
        }
      };
      mediaRecorder.start();
      setIsRecording(true);
      recordingTimerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } catch (e) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);
    setRecordingDuration(0);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);
    setRecordingDuration(0);
  };

  const loadMoreMessages = async () => {
    if (!hasMore || isLoadingMore || !oldestTimestampRef.current) return;
    setIsLoadingMore(true);
    try {
      const res = await getMessages(chatId, { before: oldestTimestampRef.current });
      const older = res.messages || [];
      if (older.length > 0) {
        setMessages(prev => [...older, ...prev]);
        oldestTimestampRef.current = older[0].createdAt;
        setHasMore(older.length >= 30);
      } else {
        setHasMore(false);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleUpdateMood = async (mood) => {
    try {
      const res = await updateMood({ mood });
      setUser({ ...currentUser, mood: res.mood });
      toast.success('Mood updated!');
    } catch (e) {
      toast.error('Mood sync failed');
    }
  };

  const handleSaveMemory = async (msg) => {
    try {
      await saveAsMemory(chatId, { messageId: msg.id, tags: ['highlight'] });
      toast.success('Saved to memories ✨', { icon: '⭐' });
    } catch (e) {
      toast.error('Memory fade...');
    }
  };

  const handleConvertToTask = async (msg) => {
    const title = msg.type === 'text' ? msg.content : 'Follow up on media';
    try {
      await convertToTask(chatId, { messageId: msg.id, title });
      toast.success('Task created! 📝', { icon: '✅' });
      setIsTasksOpen(true);
    } catch (e) {
      toast.error('Task creation failed');
    }
  };

  // ───── UTILS ─────
  const formatTime = useCallback((ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), []);
  const formatDateLabel = useCallback((ts) => {
    const d = new Date(ts);
    const today = new Date().toDateString();
    if (d.toDateString() === today) return 'Today';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);
  const getMessageDateKey = useCallback((ts) => new Date(ts).toDateString(), []);
  
  const renderTextWithLinks = (text) => {
    // Basic linkify
    if (!text) return '';
    const regex = /(https?:\/\/[^\s]+)/g;
    return text.split(regex).map((part, i) => 
      regex.test(part) ? <a key={i} href={part} target="_blank" rel="noreferrer" className="underline text-brand-300">{part}</a> : part
    );
  };

  if (authLoading || loading) return <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-500">Connecting to Comrade...</div>;
  if (error) return <div className="h-screen flex items-center justify-center bg-slate-950 text-red-500">{error}</div>;

  const other = chat.participants?.find(p => String(p.user?._id || p.user) !== String(currentUser.id || currentUser._id))?.user;
  const isOtherActive = other && activeInChat.includes(other._id);

  return (
    <main 
      className="mx-auto flex h-screen max-w-7xl flex-col overflow-hidden px-2 sm:px-4 py-3 sm:py-6 transition-all duration-500"
      style={{
        background: chat.settings?.backgroundImage ? `url(${chat.settings.backgroundImage}) center/cover no-repeat` : 'inherit',
        backgroundColor: '#020617'
      }}
    >
      <ChatHeader 
        chat={chat} 
        user={currentUser} 
        other={other} 
        isOtherActive={isOtherActive}
        onBack={() => navigate('/chats')}
        onToggleMemories={() => { setIsMemoriesOpen(!isMemoriesOpen); setIsTasksOpen(false); }}
        onToggleTasks={() => { setIsTasksOpen(!isTasksOpen); setIsMemoriesOpen(false); }}
        onUpdateMood={handleUpdateMood}
        onOpenSettings={() => toast('Settings coming soon!')}
      />

      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <MessageList 
            messages={messages}
            user={currentUser}
            onReply={setReplyTo}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
            onSaveAsMemory={handleSaveMemory}
            onConvertToTask={handleConvertToTask}
            onScrollToMessage={(id) => document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            onLoadMore={loadMoreMessages}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            formatTime={formatTime}
            formatDateLabel={formatDateLabel}
            getMessageDateKey={getMessageDateKey}
            renderTextWithLinks={renderTextWithLinks}
            getDownloadUrl={getDownloadUrl}
          />

          <div className="mt-4">
            <MessageInput 
              onSend={handleSend}
              onUpload={handleUpload}
              onStartVoice={startRecording}
              onStopVoice={stopRecording}
              onCancelVoice={cancelRecording}
              isRecording={isRecording}
              recordingDuration={recordingDuration}
              replyTo={replyTo}
              onClearReply={() => setReplyTo(null)}
              user={currentUser}
            />
          </div>
        </div>

          <MemoryPanel 
            chatId={chatId} 
            isOpen={isMemoriesOpen} 
            onClose={() => setIsMemoriesOpen(false)} 
            userId={currentUser.id || currentUser._id}
            onScrollToMessage={async (id) => {
              const el = document.getElementById(`msg-${id}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-2', 'ring-brand-500', 'ring-offset-2', 'ring-offset-slate-900');
                setTimeout(() => el.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-2', 'ring-offset-slate-900'), 2000);
              } else {
                // Not in DOM - jump to context
                const loadToast = toast.loading('Traveling back in time...');
                try {
                  const res = await getMessages(chatId, { aroundMessageId: id });
                  setMessages(res.messages);
                  setHasMore(true); // Allow more loading from this new point
                  if (res.messages.length > 0) {
                    oldestTimestampRef.current = res.messages[0].createdAt;
                  }
                  toast.success('Arrived!', { id: loadToast });
                  setTimeout(() => {
                    const newEl = document.getElementById(`msg-${id}`);
                    if (newEl) {
                      newEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      newEl.classList.add('ring-2', 'ring-brand-500', 'ring-offset-2', 'ring-offset-slate-900');
                      setTimeout(() => newEl.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-2', 'ring-offset-slate-900'), 2000);
                    }
                  }, 500);
                } catch (err) {
                  toast.error('Failed to navigate history', { id: loadToast });
                }
              }
            }}
          />
          
          <TaskPanel 
            chatId={chatId} 
            isOpen={isTasksOpen} 
            onClose={() => setIsTasksOpen(false)} 
            userId={currentUser.id || currentUser._id}
            onScrollToMessage={async (id) => {
              const el = document.getElementById(`msg-${id}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-2', 'ring-brand-500', 'ring-offset-2', 'ring-offset-slate-900');
                setTimeout(() => el.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-2', 'ring-offset-slate-900'), 2000);
              } else {
                // Not in DOM - jump to context
                const loadToast = toast.loading('Locating task message...');
                try {
                  const res = await getMessages(chatId, { aroundMessageId: id });
                  setMessages(res.messages);
                  setHasMore(true);
                  if (res.messages.length > 0) {
                    oldestTimestampRef.current = res.messages[0].createdAt;
                  }
                  toast.success('Found!', { id: loadToast });
                  setTimeout(() => {
                    const newEl = document.getElementById(`msg-${id}`);
                    if (newEl) {
                      newEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      newEl.classList.add('ring-2', 'ring-brand-500', 'ring-offset-2', 'ring-offset-slate-900');
                      setTimeout(() => newEl.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-2', 'ring-offset-slate-900'), 2000);
                    }
                  }, 500);
                } catch (err) {
                  toast.error('Failed to locate message', { id: loadToast });
                }
              }
            }}
          />
      </div>
    </main>
  );
}

export default ChatPage;