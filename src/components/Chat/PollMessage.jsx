import React from 'react';
import { voteInPoll } from '../../services/chatApi';

export function PollMessage({ message, currentUserId }) {
  const { question, options = [] } = message.pollData || {};
  const totalVotes = options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0);

  const handleVote = async (index) => {
    try {
      await voteInPoll(message.id, index);
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const hasVoted = options.some(opt => 
    opt.votes?.some(v => (v._id || v) === currentUserId)
  );

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-900/60 rounded-xl border border-slate-700/50 shadow-inner max-w-sm">
      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
        <span className="bg-brand-500 rounded-md p-1">📊</span> {question}
      </h3>
      
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => {
          const voteCount = opt.votes?.length || 0;
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          const userVotedForThis = opt.votes?.some(v => (v._id || v) === currentUserId);

          return (
            <button
              key={i}
              onClick={() => handleVote(i)}
              className={`relative overflow-hidden rounded-lg p-3 text-left transition-all duration-300 border ${
                userVotedForThis 
                  ? 'border-brand-500 bg-brand-500/10' 
                  : 'border-slate-700 hover:border-slate-500 bg-slate-800/40'
              }`}
            >
              <div 
                className="absolute left-0 top-0 bottom-0 bg-brand-500/20 transition-all duration-1000"
                style={{ width: `${percentage}%` }}
              />
              <div className="relative flex justify-between items-center text-xs">
                <span className={`font-medium ${userVotedForThis ? 'text-brand-300' : 'text-slate-200'}`}>
                  {opt.text}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {voteCount} ({Math.round(percentage)}%)
                </span>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800 pt-2">
        <span>{totalVotes} votes total</span>
        {hasVoted && <span className="text-brand-400 font-medium">✓ Voted</span>}
      </div>
    </div>
  );
}
