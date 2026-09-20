'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useState } from 'react';
const ToastContext = createContext<(message: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15000 } } }),
  );
  const [toast, setToast] = useState('');
  const notify = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 4500);
  };
  return (
    <QueryClientProvider client={client}>
      <ToastContext.Provider value={notify}>
        {children}
        {toast && (
          <div className="admin-toast" role="status">
            {toast}
            <button onClick={() => setToast('')} aria-label="Dismiss notification">
              ×
            </button>
          </div>
        )}
      </ToastContext.Provider>
    </QueryClientProvider>
  );
}
