import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

function ConfirmationModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action", 
    message = "Are you sure you want to proceed?", 
    confirmText = "Confirm", 
    cancelText = "Cancel",
    type = "danger" // 'danger' or 'info'
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
                {/* Header/Icon */}
                <div className={`flex items-center justify-center py-6 ${type === 'danger' ? 'bg-red-500/10' : 'bg-brand-500/10'}`}>
                    <div className={`rounded-full p-3 ${type === 'danger' ? 'bg-red-500/20 text-red-500' : 'bg-brand-500/20 text-brand-500'}`}>
                        <AlertTriangle className="h-8 w-8" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-800/50 text-slate-300 font-medium hover:bg-slate-700 hover:text-white transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                            type === 'danger' 
                            ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' 
                            : 'bg-brand-600 hover:bg-brand-500 shadow-brand-900/20'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>

                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full text-slate-500 hover:text-white hover:bg-slate-800 transition"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}

export default ConfirmationModal;
