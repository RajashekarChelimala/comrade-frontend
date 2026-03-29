import React, { useState } from 'react';
import { ArrowLeft, Lock, Star, ListTodo, Settings, Users, Hash } from 'lucide-react';
import { MoodPicker } from './MoodPicker';

export function ChatHeader({ 
  chat, 
  user, 
  other, 
  isOtherActive, 
  onBack, 
  onToggleMemories, 
  onToggleTasks,
  onUpdateMood,
  onOpenSettings
}) {
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  const getMoodEmoji = (moodId) => {
    const moods = {
      happy: '😊', sad: '😢', busy: '🚫', tired: '😴', excited: '🤩', neutral: '😐'
    };
    return moods[moodId] || moods.neutral;
  };

  return (
    <header className="mb-3 flex items-center gap-3 border-b border-slate-800/60 pb-3 sticky top-0 bg-slate-950/80 backdrop-blur-xl z-[50]">
      <button
        onClick={onBack}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white transition-all flex-shrink-0"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative flex-shrink-0">
          <div 
            className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm shadow-lg cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setShowMoodPicker(!showMoodPicker)}
          >
            {chat.isGroup ? <Users className="h-5 w-5" /> : (other?.name?.charAt(0).toUpperCase() || '?')}
            {!chat.isGroup && other?.mood && (
              <span className="absolute -bottom-1 -left-1 bg-slate-900 rounded-full p-0.5 text-[10px] border border-slate-800 z-10">
                {getMoodEmoji(other.mood)}
              </span>
            )}
          </div>
          {!chat.isGroup && other?.isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 border-2 border-slate-950 animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-slate-50 truncate leading-tight flex items-center gap-2">
            {chat.isGroup ? chat.name : (other?.name || 'User')}
            {chat.isGroup && <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md font-normal border border-slate-700">Group</span>}
          </h1>
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs mt-0.5">
            {!chat.isGroup ? (
              <>
                {isOtherActive ? (
                  <span className="text-brand-400 font-medium">In this chat</span>
                ) : other?.isOnline ? (
                  <span className="text-green-400 font-medium">Online {other.customStatus && `· ${other.customStatus}`}</span>
                ) : (
                  <span className="text-slate-500 truncate">
                    {other?.lastSeenAt
                      ? `Last seen ${new Date(other.lastSeenAt).toLocaleString()}`
                      : 'Offline'}
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-500">{chat.participants?.length} members</span>
            )}
            <span className="text-slate-600 hidden sm:inline">·</span>
            <span className="text-slate-600 hidden sm:flex items-center gap-1"><Lock className="h-2.5 w-2.5" /> Encrypted</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button 
          onClick={onToggleMemories}
          className="p-2 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-full transition-colors relative group"
        >
          <Star className="h-4.5 w-4.5" />
          {chat.memoryCount > 0 && (
            <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 bg-brand-500 text-white text-[9px] flex items-center justify-center rounded-full border border-slate-900 font-bold animate-fadeIn">
              {chat.memoryCount}
            </span>
          )}
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">Memories</span>
        </button>
        <button 
          onClick={onToggleTasks}
          className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-full transition-colors relative group"
        >
          <ListTodo className="h-4.5 w-4.5" />
          {chat.pendingTaskCount > 0 && (
            <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 bg-green-500 text-white text-[9px] flex items-center justify-center rounded-full border border-slate-900 font-bold animate-fadeIn">
              {chat.pendingTaskCount}
            </span>
          )}
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">Tasks</span>
        </button>
        <button 
          onClick={onOpenSettings}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
        >
          <Settings className="h-4.5 w-4.5" />
        </button>
      </div>

      {showMoodPicker && (
        <div className="absolute top-16 left-4 z-[60] animate-in fade-in zoom-in duration-200">
          <MoodPicker 
            selectedMood={user.mood} 
            onSelect={(mood) => {
              onUpdateMood(mood);
              setShowMoodPicker(false);
            }} 
          />
        </div>
      )}
    </header>
  );
}
