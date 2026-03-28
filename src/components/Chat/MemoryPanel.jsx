import React, { useEffect, useState } from 'react';
import { getMemories, deleteMemory } from '../../services/chatApi';
import { Star, Calendar, Tag, ChevronRight, Quote, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function MemoryPanel({ chatId, isOpen, onClose }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen, chatId]);

  async function loadMemories() {
    setLoading(true);
    try {
      const res = await getMemories(chatId);
      setMemories(res.memories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Group by month
  const grouped = memories.reduce((acc, memory) => {
    const date = new Date(memory.createdAt);
    const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(memory);
    return acc;
  }, {});

  async function handleDelete(id) {
    if (!window.confirm('Remove this memory?')) return;
    try {
      await deleteMemory(chatId, id);
      setMemories(prev => prev.filter(m => m._id !== id));
      toast.success('Memory removed');
    } catch (e) {
      toast.error('Failed to remove memory');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-80 bg-slate-900 border-l border-slate-800 shadow-2xl z-[100] transform transition-transform duration-300 flex flex-col">
      <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-2 text-brand-400 font-bold">
          <Star className="h-5 w-5 fill-brand-400" />
          <span>Shared Memories</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition">
          <ChevronRight className="h-6 w-6" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Quote className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-medium">No memories saved yet.</p>
            <p className="text-xs mt-1">Star a message to save it forever.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([month, items]) => (
            <div key={month} className="mb-8">
              <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> {month}
              </h3>
              <div className="space-y-4">
                {items.map((memory) => (
                  <div
                    key={memory._id}
                    className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50 hover:bg-slate-800/60 transition group cursor-pointer"
                    onClick={() => {
                      const msgId = memory.message?._id || memory.message;
                      const el = document.getElementById(`msg-${msgId}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-brand-500', 'ring-offset-2', 'ring-offset-slate-900');
                        setTimeout(() => el.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-2', 'ring-offset-slate-900'), 2000);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(memory.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        {memory.tags?.length > 0 && (
                          <div className="flex gap-1">
                            {memory.tags.map(t => (
                              <span key={t} className="text-[9px] bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded-md border border-brand-500/20">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(memory._id); }}
                          className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 border-l-2 border-brand-500/30 pl-2 italic">
                      "{memory.message?.content || 'Media memory'}"
                    </p>
                    {memory.notes && (
                      <p className="text-[11px] text-slate-400 mt-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                        {memory.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
