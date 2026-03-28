import React from 'react';
import { Smile, Frown, Zap, Coffee, Heart } from 'lucide-react';

const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: 'text-yellow-400' },
  { id: 'sad', emoji: '😢', label: 'Sad', color: 'text-blue-400' },
  { id: 'busy', emoji: '🚫', label: 'Busy', color: 'text-red-400' },
  { id: 'tired', emoji: '😴', label: 'Tired', color: 'text-purple-400' },
  { id: 'excited', emoji: '🤩', label: 'Excited', color: 'text-orange-400' },
  { id: 'neutral', emoji: '😐', label: 'Neutral', color: 'text-slate-400' },
];

export function MoodPicker({ selectedMood, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 p-2 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl">
      {MOODS.map((mood) => (
        <button
          key={mood.id}
          onClick={() => onSelect(mood.id)}
          className={`group relative flex flex-col items-center justify-center h-12 w-12 rounded-xl transition-all duration-200 ${
            selectedMood === mood.id 
              ? 'bg-brand-500/20 border border-brand-500/50 scale-110' 
              : 'hover:bg-slate-800 border border-transparent'
          }`}
          title={mood.label}
        >
          <span className="text-2xl group-hover:scale-125 transition-transform">{mood.emoji}</span>
          <span className={`text-[10px] mt-1 font-medium ${selectedMood === mood.id ? 'text-brand-400' : 'text-slate-500'}`}>
            {mood.label}
          </span>
        </button>
      ))}
    </div>
  );
}
