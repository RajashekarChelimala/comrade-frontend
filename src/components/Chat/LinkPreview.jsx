import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

export function LinkPreview({ url }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd call a backend endpoint that scrapes the URL
    // For now, let's pretend we have a preview
    setLoading(true);
    setTimeout(() => {
      setPreview({
        title: 'Premium Networking for Teams',
        description: 'Experience the next generation of team collaboration with Comrade Platform.',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2670&auto=format&fit=crop',
        domain: new URL(url).hostname
      });
      setLoading(false);
    }, 1500);
  }, [url]);

  if (loading) return (
     <div className="mt-2 h-20 bg-slate-800/50 rounded-lg animate-pulse border border-slate-700/50 flex items-center justify-center">
        <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Fetching Preview...</span>
     </div>
  );

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="mt-2 block bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-brand-500/50 transition-all group shadow-xl max-w-[280px]"
    >
      {preview.image && (
        <img src={preview.image} alt="Preview" className="h-32 w-full object-cover group-hover:scale-105 transition-transform" />
      )}
      <div className="p-3">
        <p className="text-[10px] text-brand-400 font-bold uppercase tracking-tight mb-1">{preview.domain}</p>
        <h4 className="text-xs font-bold text-slate-100 line-clamp-1 group-hover:text-brand-300">{preview.title}</h4>
        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{preview.description}</p>
      </div>
    </a>
  );
}
