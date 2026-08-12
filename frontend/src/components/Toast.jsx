import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-sky-500" />
  };

  const bgStyles = {
    success: 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100',
    error: 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100',
    info: 'bg-sky-50 dark:bg-sky-950/90 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md max-w-md ${bgStyles[toast.type || 'info']}`}>
        {icons[toast.type || 'info']}
        <span className="text-xs font-semibold">{toast.message}</span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:bg-black/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
