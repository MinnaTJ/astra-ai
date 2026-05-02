import { useToast } from '@/contexts/ToastContext';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl shadow-black/20 border backdrop-blur-md animate-in slide-in-from-right-8 fade-in duration-300 ${
            toast.type === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : toast.type === 'info'
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              : 'bg-green-500/10 border-green-500/20 text-green-400'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={18} /> : toast.type === 'info' ? <Info size={18} /> : <CheckCircle size={18} />}
          <p className="text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 hover:bg-white/10 p-1 rounded-lg transition-all"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
