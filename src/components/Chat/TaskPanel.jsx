import { useEffect, useState } from 'react';
import { getTasks, updateTaskStatus, deleteTask } from '../../services/chatApi';
import { ListTodo, CheckCircle2, Circle, Clock, ChevronRight, User, Trash2 } from 'lucide-react';

export function TaskPanel({ chatId, isOpen, onClose, userId, onScrollToMessage }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
  }, [isOpen, chatId]);

  async function loadTasks() {
    setLoading(true);
    try {
      const res = await getTasks(chatId);
      setTasks(res.tasks || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(task) {
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    try {
      await updateTaskStatus(chatId, task._id, newStatus);
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteTaskItem(id) {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(chatId, id);
      setTasks(prev => prev.filter(t => t._id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-80 bg-slate-950 border-l border-slate-800 shadow-2xl z-[100] flex flex-col transition-all duration-300">
      <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-2 text-green-400 font-bold">
          <ListTodo className="h-5 w-5" />
          <span>Chat Tasks</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition">
          <ChevronRight className="h-6 w-6" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-10" />
            <p className="text-sm font-medium">No tasks found.</p>
            <p className="text-xs mt-1">Convert messages to tasks to stay organized.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task._id}
                className={`group p-3 rounded-xl border transition-all ${task.status === 'done'
                  ? 'bg-slate-900/40 border-slate-800 opacity-60'
                  : 'bg-slate-800/40 border-slate-700 hover:border-green-500/50'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleStatus(task)}
                    className={`mt-0.5 flex-shrink-0 transition-colors ${task.status === 'done' ? 'text-green-500' : 'text-slate-500 hover:text-green-400'
                      }`}
                  >
                    {task.status === 'done' ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      if (task.createdFromMessage) {
                        onClose();
                        onScrollToMessage(task.createdFromMessage._id || task.createdFromMessage);
                      }
                    }}
                  >
                    <h4 className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center gap-3 mt-3 text-[10px]">
                      {task.assignedTo && (
                        <div className="flex items-center gap-1 text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-md border border-brand-500/20">
                          <User className="h-2.5 w-2.5" />
                          <span>{task.assignedTo.name}</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <div className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() ? 'text-red-400' : 'text-slate-500'}`}>
                          <Clock className="h-2.5 w-2.5" />
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Only allow creator to delete */}
                  {String(userId) === String(task.createdBy?._id || task.createdBy) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTaskItem(task._id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
