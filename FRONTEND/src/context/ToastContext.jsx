import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const success = useCallback((message) => addToast(message, 'success'), [addToast]);
  const error = useCallback((message) => addToast(message, 'error'), [addToast]);
  const info = useCallback((message) => addToast(message, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 md:top-5 right-4 md:right-5 z-[99999] flex flex-col gap-2 pointer-events-none w-max max-w-[calc(100vw-32px)] md:max-w-sm">
        {toasts.map((toast) => (
            <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-2.5 md:gap-3 w-auto md:min-w-[300px] p-2.5 md:p-4 rounded-lg md:rounded-xl shadow-xl border transform transition-all duration-300 animate-slide-down
              ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : ''}
              ${toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : ''}
              ${toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
            `}
          >
            {/* Icon */}
            <div className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center
              ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : ''}
              ${toast.type === 'error' ? 'bg-rose-100 text-rose-600' : ''}
              ${toast.type === 'info' ? 'bg-blue-100 text-blue-600' : ''}
            `}>
              <span className="material-symbols-outlined text-[16px] md:text-[18px]">
                {toast.type === 'success' && 'check_circle'}
                {toast.type === 'error' && 'error'}
                {toast.type === 'info' && 'info'}
              </span>
            </div>

            {/* Message */}
            <p className="flex-1 text-[11px] md:text-sm font-semibold">
              {toast.message}
            </p>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] md:text-[18px]">close</span>
            </button>
          </div>
        ))}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }
      `}} />
    </ToastContext.Provider>
  );
};
