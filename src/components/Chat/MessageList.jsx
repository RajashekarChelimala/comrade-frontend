import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { MessageItem } from './MessageItem';
import { ChevronDown } from 'lucide-react';

export function MessageList({ 
  messages, 
  user, 
  onReply, 
  onReact, 
  onDelete, 
  onEdit,
  onSaveAsMemory,
  onConvertToTask,
  onScrollToMessage,
  onLoadMore,
  hasMore,
  isLoadingMore,
  formatTime,
  formatDateLabel,
  getMessageDateKey,
  renderTextWithLinks,
  getDownloadUrl
}) {
  const containerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isInitialLoad = useRef(true);
  const lastScrollHeight = useRef(0);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // ───── SCROLL POSITION PRESERVATION ─────
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || isInitialLoad.current) return;

    if (isLoadingMore) {
      lastScrollHeight.current = container.scrollHeight;
    }
  }, [isLoadingMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || messages.length === 0) return;

    // 1. Initial Load: Snap to bottom instantly
    if (isInitialLoad.current) {
      scrollToBottom('auto');
      isInitialLoad.current = false;
      return;
    }

    // 2. Pagination: Preserve scroll point
    if (lastScrollHeight.current > 0) {
      const heightDiff = container.scrollHeight - lastScrollHeight.current;
      container.scrollTop += heightDiff;
      lastScrollHeight.current = 0;
      return;
    }

    // 3. New Message: Scroll only if near bottom or from self
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 350;
    const lastMessage = messages[messages.length - 1];
    const user_id = user.id || user._id;
    const sender_id = lastMessage.sender?._id || lastMessage.sender;
    const isMe = String(sender_id) === String(user_id);

    if (isNearBottom || isMe) {
      scrollToBottom('smooth');
    }
  }, [messages, user]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Load more logic
      if (container.scrollTop < 50 && hasMore && !isLoadingMore) {
        onLoadMore();
      }

      // Show/Hide scroll to bottom button
      const isFarFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight > 400;
      setShowScrollButton(isFarFromBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, onLoadMore]);

  return (
    <div className="flex-1 min-h-0 relative group/list">
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-thin p-3 sm:p-4 bg-slate-950/20 rounded-2xl border border-slate-800/50"
      >
        <div className="flex flex-col gap-2">
          {isLoadingMore && (
            <div className="flex justify-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500" />
            </div>
          )}
          
          {messages.map((m, index) => {
            const user_id = user.id || user._id;
            const sender_id = m.sender?._id || m.sender;
            const isMe = String(sender_id) === String(user_id);
            const showDateSeparator = index === 0 || 
              getMessageDateKey(m.createdAt) !== getMessageDateKey(messages[index - 1].createdAt);

            return (
              <React.Fragment key={m.id || m.tempId || m._id}>
                {showDateSeparator && (
                  <div className="flex justify-center my-4 sticky top-0 z-10">
                    <div className="bg-slate-800/80 backdrop-blur-md px-4 py-1 rounded-full shadow-lg border border-slate-700/30">
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                        {formatDateLabel(m.createdAt)}
                      </span>
                    </div>
                  </div>
                )}
                <MessageItem 
                  m={m} 
                  isMe={isMe} 
                  user={user}
                  onReply={onReply}
                  onReact={onReact}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onSaveAsMemory={onSaveAsMemory}
                  onConvertToTask={onConvertToTask}
                  onScrollToMessage={onScrollToMessage}
                  formatTime={formatTime}
                  renderTextWithLinks={renderTextWithLinks}
                  getDownloadUrl={getDownloadUrl}
                />
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-4 right-4 p-2.5 bg-brand-500/90 hover:bg-brand-500 text-white rounded-full shadow-xl transition-all z-[60] animate-bounce-subtle backdrop-blur-sm border border-white/10"
          title="Go to bottom"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
