import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Mic, Square, X, Paperclip, Clock,
  Eye, EyeOff, BarChart2, Smile, Sparkles, CalendarDays
} from 'lucide-react';
import toast from 'react-hot-toast';

export function MessageInput({
  onSend,
  onUpload,
  onStartVoice,
  onStopVoice,
  onCancelVoice,
  isRecording,
  recordingDuration,
  replyTo,
  onClearReply,
  user
}) {
  const [text, setText] = useState('');
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);

  // Scheduling states
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [isSurprise, setIsSurprise] = useState(false);
  const [unlockAt, setUnlockAt] = useState('');

  const textareaRef = useRef(null);

  const handleInput = (e) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!text.trim() && !isScheduled) return;

    onSend({
      type: 'text',
      text: text.trim(),
      isScheduled,
      scheduledFor: isScheduled ? scheduledFor : undefined,
      isSurprise,
      unlockAt: isSurprise ? (unlockAt || scheduledFor) : undefined
    });

    setText('');
    setIsScheduled(false);
    setIsSurprise(false);
    setShowScheduling(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const formatRecordingTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) setPollOptions([...pollOptions, '']);
  };

  const handleSendPoll = () => {
    if (!pollQuestion.trim() || pollOptions.some(o => !o.trim())) return;
    onSend({
      type: 'poll',
      pollData: {
        question: pollQuestion,
        options: pollOptions.map(text => ({ text, votes: [] }))
      }
    });
    setShowPollCreator(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  // Emoji Picker State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');

  const EMOJI_COLLECTION = [
    { char: '😀', name: 'smile happy' }, { char: '😂', name: 'laugh lol' }, { char: '🤣', name: 'rofl' }, { char: '😊', name: 'blush' },
    { char: '😇', name: 'angel' }, { char: '🥰', name: 'love heart' }, { char: '😍', name: 'heart eyes' }, { char: '🤩', name: 'star' },
    { char: '😘', name: 'kiss' }, { char: '😋', name: 'yum' }, { char: '😛', name: 'tongue' }, { char: '😜', name: 'wink' },
    { char: '🤔', name: 'think' }, { char: '🤨', name: 'hmm' }, { char: '😐', name: 'neutral' }, { char: '😑', name: 'expressionless' },
    { char: '😶', name: 'mouthless' }, { char: '😏', name: 'smirk' }, { char: '😒', name: 'unhappy' }, { char: '🙄', name: 'roll eyes' },
    { char: '😬', name: 'grimace' }, { char: '🤥', name: 'liar' }, { char: '😌', name: 'relieved' }, { char: '😔', name: 'sad' },
    { char: '😪', name: 'sleepy' }, { char: '😴', name: 'sleep' }, { char: '😷', name: 'sick' }, { char: '🤒', name: 'fever' },
    { char: '🤢', name: 'nauseated' }, { char: '🤮', name: 'vomit' }, { char: '🥵', name: 'hot' }, { char: '🥶', name: 'cold' },
    { char: '🥴', name: 'tipsy' }, { char: '😵', name: 'dizzy' }, { char: '🤯', name: 'mind blown' }, { char: '🤠', name: 'cowboy' },
    { char: '🥳', name: 'party' }, { char: '😎', name: 'cool' }, { char: '🤓', name: 'nerd' }, { char: '🧐', name: 'monocle' },
    { char: '❤️', name: 'heart love' }, { char: '🧡', name: 'orange heart' }, { char: '💛', name: 'yellow heart' }, { char: '💚', name: 'green heart' },
    { char: '💙', name: 'blue heart' }, { char: '💜', name: 'purple heart' }, { char: '🖤', name: 'black heart' }, { char: '🤍', name: 'white heart' },
    { char: '💔', name: 'broken heart' }, { char: '❣️', name: 'exclamation' }, { char: '💕', name: 'hearts' }, { char: '💞', name: 'revolving' },
    { char: '🔥', name: 'fire hot' }, { char: '✨', name: 'sparkles' }, { char: '⭐', name: 'star' }, { char: '🌟', name: 'glowing' },
    { char: '☁️', name: 'cloud' }, { char: '🌈', name: 'rainbow' }, { char: '☀️', name: 'sun' }, { char: '🌙', name: 'moon' },
    { char: '⚡', name: 'lightning' }, { char: '❄️', name: 'snowflake' }, { char: '🌊', name: 'wave' }, { char: '🐾', name: 'paws' },
    { char: '🐱', name: 'cat' }, { char: '🐶', name: 'dog' }, { char: '🐭', name: 'mouse' }, { char: '🐹', name: 'hamster' },
    { char: '🐰', name: 'rabbit' }, { char: '🦊', name: 'fox' }, { char: '🐻', name: 'bear' }, { char: '🐼', name: 'panda' },
    { char: '🐨', name: 'koala' }, { char: '🐯', name: 'tiger' }, { char: '🦁', name: 'lion' }, { char: '🐮', name: 'cow' },
    { char: '🐷', name: 'pig' }, { char: '🐸', name: 'frog' }, { char: '🐵', name: 'monkey' }, { char: '🦄', name: 'unicorn' },
    { char: '🍎', name: 'apple' }, { char: '🍓', name: 'strawberry' }, { char: '🍕', name: 'pizza' }, { char: '🍔', name: 'burger' },
    { char: '🍦', name: 'icecream' }, { char: '🍩', name: 'donut' }, { char: '🍪', name: 'cookie' }, { char: '🍫', name: 'chocolate' },
    { char: '☕', name: 'coffee' }, { char: '🍺', name: 'beer' }, { char: '🍷', name: 'wine' }, { char: '🥤', name: 'soda' },
  ];

  const filteredEmojis = EMOJI_COLLECTION.filter(e => 
    e.name.toLowerCase().includes(emojiSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2 bg-slate-900/40 p-2 sm:p-3 rounded-3xl border border-slate-800/60 backdrop-blur-xl shadow-2xl relative">

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 mb-4 p-3 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-[70] animate-in slide-in-from-bottom-2 w-64">
          <div className="flex flex-col gap-3">
             <input 
               type="text"
               value={emojiSearch}
               onChange={(e) => setEmojiSearch(e.target.value)}
               placeholder="Search emojis..."
               className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
               autoFocus
             />
             <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {filteredEmojis.map(emoji => (
                  <button
                    key={emoji.char}
                    onClick={() => { setText(prev => prev + emoji.char); setShowEmojiPicker(false); setEmojiSearch(''); }}
                    className="h-8 w-8 flex items-center justify-center text-lg hover:bg-slate-700 rounded-lg transition-colors"
                    title={emoji.name}
                  >
                    {emoji.char}
                  </button>
                ))}
                {filteredEmojis.length === 0 && (
                  <div className="col-span-6 py-4 text-center text-[10px] text-slate-500 italic">
                    No emojis found
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Poll Creator Modal */}
      {showPollCreator && (
        <div className="absolute bottom-full left-0 right-0 mb-4 p-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col gap-3 z-[70] animate-in zoom-in-95">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Create Poll</h4>
            <button onClick={() => setShowPollCreator(false)}><X className="h-4 w-4 text-slate-500" /></button>
          </div>
          <input
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            placeholder="Poll Question..."
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
          />
          <div className="space-y-2">
            {pollOptions.map((opt, i) => (
              <input
                key={i}
                value={opt}
                onChange={(e) => {
                  const newOpts = [...pollOptions];
                  newOpts[i] = e.target.value;
                  setPollOptions(newOpts);
                }}
                placeholder={`Option ${i + 1}`}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {pollOptions.length < 5 && (
              <button
                onClick={handleAddPollOption}
                className="text-[10px] text-brand-400 font-bold hover:underline"
              >+ Add Option</button>
            )}
            <button
              onClick={handleSendPoll}
              disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
              className="bg-brand-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
            >Create Poll</button>
          </div>
        </div>
      )}

      {/* Reply Preview */}
      {replyTo && (
        <div className="flex items-center gap-3 p-2 mx-1 mb-2 bg-brand-500/10 border-l-4 border-brand-500 rounded-lg animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-tighter">Replying to {replyTo.sender?.name || 'User'}</p>
            <p className="text-xs text-slate-300 truncate opacity-80">{replyTo.type === 'text' ? replyTo.content : `[${replyTo.type}]`}</p>
          </div>
          <button onClick={onClearReply} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      )}

      {/* Scheduling / Surprise UI (Message Magic) */}
      {showScheduling && (
        <div className="absolute bottom-full left-0 right-0 mb-4 p-4 bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl z-[80] animate-in zoom-in-95 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-orange-500 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Message Magic
            </h4>
            <button onClick={() => setShowScheduling(false)} className="p-1 hover:bg-white/10 rounded-full transition"><X className="h-4 w-4 text-slate-500" /></button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                  <CalendarDays className="h-5 w-5 text-orange-400" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Schedule Delivery</label>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    className="bg-transparent text-sm text-white focus:outline-none w-full [color-scheme:dark]"
                    onChange={(e) => {
                      setScheduledFor(e.target.value);
                      setIsScheduled(!!e.target.value);
                    }}
                  />
                </div>
                {isScheduled && (
                  <button 
                    onClick={() => { setScheduledFor(''); setIsScheduled(false); }}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase"
                  >Clear</button>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsSurprise(!isSurprise)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                isSurprise ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-950/50 border-slate-800/50 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                  isSurprise ? 'bg-indigo-500/20 border-indigo-500/40' : 'bg-slate-800/50 border-slate-700/30'
                }`}>
                  {isSurprise ? <EyeOff className="h-5 w-5 text-indigo-400" /> : <Eye className="h-5 w-5 text-slate-500" />}
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-white uppercase tracking-wider">Surprise Message</p>
                  <p className="text-[10px] text-slate-500">Hide content until scheduled time</p>
                </div>
              </div>
              <div className={`h-5 w-10 rounded-full border p-1 transition-all ${
                isSurprise ? 'bg-indigo-500/40 border-indigo-500' : 'bg-slate-800 border-slate-700'
              }`}>
                <div className={`h-full aspect-square rounded-full bg-white transition-all ${
                  isSurprise ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </div>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 px-1">
        {/* Attachment Button */}
        <button
          onClick={onUpload}
          className="flex h-10 w-10 mb-0.5 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white transition-all transform active:scale-95"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Input Area */}
        <div className="flex-1 relative bg-slate-800/50 rounded-2xl border border-slate-700/50 focus-within:border-brand-500/30 transition-all shadow-inner">
          {isRecording ? (
            <div className="flex items-center gap-3 px-3 h-11 animate-pulse">
              <div className="flex h-2.5 w-2.5 items-center justify-center">
                <span className="absolute h-2.5 w-2.5 rounded-full bg-red-500 animate-ping opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-red-500" />
              </div>
              <span className="text-sm font-mono text-red-400">{formatRecordingTime(recordingDuration)}</span>
              <div className="flex-1 flex gap-1 items-center justify-center opacity-40">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-1 bg-brand-400 rounded-full" style={{ height: `${Math.random() * 20 + 4}px` }} />
                ))}
              </div>
              <button onClick={onCancelVoice} className="text-[11px] font-bold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest px-2">Cancel</button>
            </div>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Write a message..."
                rows={1}
                className="w-full bg-transparent p-3 text-sm text-slate-50 placeholder-slate-500 focus:outline-none resize-none overflow-hidden max-h-[120px] scrollbar-none"
              />
              <div className="absolute right-3 bottom-2 flex items-center gap-2">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-1.5 rounded-lg transition ${showEmojiPicker ? 'text-brand-400 bg-brand-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Smile className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Action Button (Send or Voice) */}
        {!text.trim() && !isRecording && !isScheduled && !showPollCreator ? (
          <button
            onClick={onStartVoice}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all active:scale-90"
          >
            <Mic className="h-5 w-5" />
          </button>
        ) : isRecording ? (
          <button
            onClick={onStopVoice}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-all animate-pulse"
          >
            <Square className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all active:scale-90 transform shadow-lg ${isScheduled ? 'bg-orange-600 text-white' : 'bg-brand-500 text-white hover:bg-brand-400'
              }`}
          >
            <Send className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 px-4 py-1.5 text-[10px] text-slate-500 border-t border-slate-800/40 mt-1">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`flex items-center gap-1.5 transition-colors ${showEmojiPicker ? 'text-brand-400' : 'hover:text-brand-400'}`}
        ><Smile className="h-3 w-3" /> Emoji</button>
        
        <button
          onClick={() => setShowScheduling(!showScheduling)}
          className={`flex items-center gap-1.5 transition-colors ${showScheduling || isScheduled ? 'text-orange-400' : 'hover:text-orange-400'}`}
        >
          <CalendarDays className="h-3 w-3" /> 
          <span>Magic</span>
          {isScheduled && <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse ml-0.5" />}
        </button>

        <button
          onClick={() => setShowPollCreator(!showPollCreator)}
          className={`flex items-center gap-1.5 transition-colors ${showPollCreator ? 'text-brand-400' : 'hover:text-brand-400'}`}
        >
          <BarChart2 className="h-3 w-3" /> Poll
        </button>
        <button
          onClick={() => toast('Games: Tic-Tac-Toe coming soon!')}
          className="flex items-center gap-1.5 hover:text-brand-400 transition-colors"
        ><Sparkles className="h-3 w-3" /> Games</button>
      </div>
    </div>
  );
}
