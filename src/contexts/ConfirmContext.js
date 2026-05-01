import { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({
        ...options,
        resolve: (value) => {
          setConfirmState(null);
          resolve(value);
        }
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {confirmState && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-2xl shrink-0 ${confirmState.isDestructive !== false ? 'bg-red-500/10 text-red-400' : 'bg-violet-500/10 text-violet-400'}`}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{confirmState.title || 'Confirm Action'}</h3>
                <p className="text-sm text-gray-400">{confirmState.message}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => confirmState.resolve(false)}
                className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all text-sm"
              >
                {confirmState.cancelText || 'Cancel'}
              </button>
              <button
                onClick={() => confirmState.resolve(true)}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all text-sm shadow-lg active:scale-[0.98] ${
                  confirmState.isDestructive !== false 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 shadow-red-500/10 border border-red-500/30'
                    : 'bg-violet-600 text-white hover:bg-violet-500 shadow-violet-600/20'
                }`}
              >
                {confirmState.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
