import React, { useState } from 'react';
import { 
  Check, CheckCheck, Clock, Download, Reply, 
  Trash2, MoreVertical, Copy, Star, ListTodo,
  CalendarDays, EyeOff, Edit3, FileText, Loader2
} from 'lucide-react';
import { PollMessage } from './PollMessage';

export function MessageItem({ 
  m, 
  isMe, 
  user,
  onReply,
  onReact,
  onDelete,
  onEdit,
  onSaveAsMemory,
  onConvertToTask,
  onScrollToMessage,
  formatTime,
  renderTextWithLinks,
  getDownloadUrl
}) {
  const [showOptions, setShowOptions] = useState(false);
  const myId = user.id || user._id;

  const renderStatusIcon = () => {
    if (!isMe) return null;
    if (m.isUploading || m.isScheduled) return <Clock className="h-3 w-3 text-slate-400/80 ml-1" />;
    if (m.readBy && m.readBy.length > 0) return <CheckCheck className="h-3.5 w-3.5 text-blue-400 ml-1" />;
    return <Check className="h-3.5 w-3.5 text-slate-400/80 ml-1" />;
  };

  const isUnlocked = !m.isSurprise || (m.unlockAt && new Date(m.unlockAt) <= new Date());

  const isEmojiOnly = (text) => {
    if (!text) return false;
    // Remove all emojis, variation selectors, and whitespace
    const emojiMatch = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}\u{200D}\u{2000}-\u{200F}\u{FE0F}]/gu;
    const remaining = text.trim().replace(emojiMatch, '').replace(/\s/g, '');
    return remaining.length === 0;
  };

  const getEmojiCount = (text) => {
    // Robustly count emojis even if they are multi-char (surrogate pairs)
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    const segments = [...segmenter.segment(text.trim())];
    return segments.filter(s => s.segment.trim()).length;
  };

  const renderContent = () => {
    if (m.type === 'text') {
      const trimmed = m.content?.trim();
      const emojiCount = isEmojiOnly(trimmed) ? getEmojiCount(trimmed) : 0;

      if (emojiCount > 0 && emojiCount <= 3) {
        const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
        const emojis = [...segmenter.segment(trimmed)].filter(s => s.segment.trim());
        
        const sizeClass = emojiCount === 1 ? 'text-7xl' : emojiCount === 2 ? 'text-5xl' : 'text-4xl';
        
        return (
          <div className={`flex items-center gap-2 py-2 ${sizeClass}`}>
            {emojis.map((e, i) => (
              <span key={i} className="emoji-fancy">{e.segment}</span>
            ))}
          </div>
        );
      }

      return (
        <div className="flex flex-col">
          <p className="whitespace-pre-wrap leading-relaxed">{renderTextWithLinks(m.content)}</p>
          {m.editHistory?.length > 0 && (
            <span className="text-[9px] opacity-50 flex items-center gap-1 mt-1">
              <Edit3 className="h-2 w-2" /> Edited
            </span>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1 animate-fadeIn`}
      id={`msg-${m.id || m._id}`}
    >
      <div className={`relative max-w-[90%] sm:max-w-[80%] flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
          <div
            className={`rounded-2xl px-3 py-2 text-sm shadow-md transition-all duration-200 select-none relative overflow-hidden ${
              isMe
                ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-br-sm'
                : 'bg-slate-800/90 text-slate-50 rounded-bl-sm'
            } ${m.isScheduled ? 'opacity-70 border-2 border-dashed border-brand-400/30' : ''}`}
            onClick={() => setShowOptions(!showOptions)}
          >
            {/* Reply Target */}
            {m.replyTo && (
              <div
                className="mb-2 rounded-lg bg-black/20 backdrop-blur-sm px-2 py-1.5 text-[11px] text-slate-200 cursor-pointer border-l-2 border-brand-400"
                onClick={(e) => {
                  e.stopPropagation();
                  onScrollToMessage(m.replyTo.id || m.replyTo._id);
                }}
              >
                <p className="font-bold flex items-center gap-1 opacity-70">
                  <Reply className="h-3 w-3 rotate-180" />
                  {m.replyTo.sender?.comradeId || 'User'}
                </p>
                <p className="truncate opacity-80 italic">
                  {m.replyTo.type === 'text' ? m.replyTo.content : `[${m.replyTo.type}]`}
                </p>
              </div>
            )}

            {/* Surprise / Hidden Content */}
            {!isUnlocked ? (
               <div className="flex flex-col items-center gap-2 py-4 px-6 text-slate-400">
                  <EyeOff className="h-8 w-8 opacity-20" />
                  <p className="text-[11px] font-medium uppercase tracking-widest text-brand-300">Surprise Message</p>
                  <p className="text-[10px] opacity-70">Unlocks at {new Date(m.unlockAt).toLocaleString()}</p>
               </div>
            ) : (
              <>
                {/* Content Rendering */}
                {renderContent()}

                {/* Media Content */}
                {(m.type === 'media' || m.type === 'voice') && m.mediaUrl && (
                  <div className="rounded-lg overflow-hidden my-1 bg-black/10 relative">
                    {m.isUploading && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                        <Loader2 className="h-8 w-8 text-white animate-spin opacity-80" />
                      </div>
                    )}
                    {m.mediaType === 'image' ? (
                      <div className="relative group/media">
                        <img src={m.mediaUrl} alt="Media" className={`max-h-64 object-cover ${m.isUploading ? 'opacity-50 grayscale-[20%]' : ''}`} />
                        {!m.isUploading && (
                          <a 
                            href={getDownloadUrl(m.mediaUrl)} 
                            download 
                            className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 rounded-lg text-white opacity-0 group-hover/media:opacity-100 transition-opacity backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    ) : m.mediaType === 'video' ? (
                      <div className="relative group/media">
                        <video src={m.mediaUrl} controls className={`max-h-64 ${m.isUploading ? 'opacity-50' : ''}`} />
                         {!m.isUploading && (
                          <a 
                            href={getDownloadUrl(m.mediaUrl)} 
                            download 
                            className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 rounded-lg text-white opacity-0 group-hover/media:opacity-100 transition-opacity backdrop-blur-sm z-20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    ) : (m.mediaType === 'audio' || m.type === 'voice') ? (
                       <div className="p-2 min-w-[200px] bg-slate-900/40">
                          <audio src={m.mediaUrl} controls className="w-full h-8 brightness-90 contrast-125" />
                          <div className="flex justify-between items-center mt-1 px-1">
                             <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Voice Note</span>
                             {!m.isUploading && (
                                <a href={getDownloadUrl(m.mediaUrl)} download className="text-slate-500 hover:text-white transition">
                                   <Download className="h-3 w-3" />
                                </a>
                             )}
                          </div>
                       </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-slate-900/40">
                         <FileText className="h-6 w-6 text-brand-400" />
                         <div className="flex-1 min-w-0">
                            <p className="text-xs truncate font-medium">{m.fileName || 'File'}</p>
                            <p className="text-[10px] text-slate-500">{Math.round(m.fileSize / 1024)} KB</p>
                         </div>
                         {!m.isUploading && (
                            <a href={getDownloadUrl(m.mediaUrl)} download className="p-2 bg-brand-500 rounded-full hover:scale-110 transition-transform">
                               <Download className="h-3.5 w-3.5" />
                            </a>
                         )}
                         {m.isUploading && <Loader2 className="h-4 w-4 text-brand-400 animate-spin" />}
                      </div>
                    )}
                  </div>
                )}

                {/* Poll Content */}
                {m.type === 'poll' && (
                  <PollMessage message={m} currentUserId={myId} />
                )}
              </>
            )}

            {/* Footer / Time */}
            <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] ${isMe ? 'text-brand-200/70' : 'text-slate-400/70'} justify-end`}>
              {m.isScheduled && <CalendarDays className="h-2.5 w-2.5" />}
              <span>{formatTime(m.scheduledFor || m.createdAt)}</span>
              {renderStatusIcon()}
            </div>
          </div>

          {/* Action Popover */}
          {showOptions && (
            <div className={`mt-2 flex items-center gap-1 p-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-10 animate-in slide-in-from-top-2 duration-200 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <button 
                onClick={(e) => { e.stopPropagation(); onReply(m); setShowOptions(false); }}
                className="p-2 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                title="Reply"
              >
                <Reply className="h-4 w-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onSaveAsMemory(m); setShowOptions(false); }}
                className="p-2 hover:bg-slate-700 text-yellow-400 rounded-lg transition-colors"
                title="Save Memory"
              >
                <Star className="h-4 w-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onConvertToTask(m); setShowOptions(false); }}
                className="p-2 hover:bg-slate-700 text-green-400 rounded-lg transition-colors"
                title="Convert to Task"
              >
                <ListTodo className="h-4 w-4" />
              </button>
              {isMe && !m.isDeleted && (
                 <>
                   <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(m); setShowOptions(false); }}
                    className="p-2 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(m); setShowOptions(false); }}
                    className="p-2 hover:bg-slate-700 text-red-400 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                 </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
