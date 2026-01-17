import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastType } from '../components/Toast';

interface ToastMessage {
     id: string;
     message: string;
     type: ToastType;
     onRetry?: () => void;
}

interface ToastContextType {
     showToast: (message: string, type: ToastType, onRetry?: () => void) => void;
     showSuccess: (message: string) => void;
     showError: (message: string, onRetry?: () => void) => void;
     showWarning: (message: string) => void;
     showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
     const context = useContext(ToastContext);
     if (!context) {
          throw new Error('useToast must be used within a ToastProvider');
     }
     return context;
};

interface ToastProviderProps {
     children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
     const [toasts, setToasts] = useState<ToastMessage[]>([]);

     const showToast = useCallback((message: string, type: ToastType, onRetry?: () => void) => {
          const id = `toast-${Date.now()}-${Math.random()}`;
          setToasts((prev) => [...prev, { id, message, type, onRetry }]);
     }, []);

     const showSuccess = useCallback((message: string) => {
          showToast(message, 'success');
     }, [showToast]);

     const showError = useCallback((message: string, onRetry?: () => void) => {
          showToast(message, 'error', onRetry);
     }, [showToast]);

     const showWarning = useCallback((message: string) => {
          showToast(message, 'warning');
     }, [showToast]);

     const showInfo = useCallback((message: string) => {
          showToast(message, 'info');
     }, [showToast]);

     const removeToast = useCallback((id: string) => {
          setToasts((prev) => prev.filter((toast) => toast.id !== id));
     }, []);

     return (
          <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
               {children}
               <div className="fixed top-4 right-4 z-50 space-y-2">
                    {toasts.map((toast, index) => (
                         <div key={toast.id} style={{ marginTop: index > 0 ? '8px' : '0' }}>
                              <Toast
                                   message={toast.message}
                                   type={toast.type}
                                   onClose={() => removeToast(toast.id)}
                                   onRetry={toast.onRetry}
                              />
                         </div>
                    ))}
               </div>
          </ToastContext.Provider>
     );
};
