import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context.showToast;
}

function ToastProvider({ children }) {
  const [messages, setMessages] = useState([]);

  const showToast = useCallback((text) => {
    const id = Date.now().toString();
    setMessages((current) => [...current, { id, text }]);
    window.setTimeout(() => {
      setMessages((current) => current.filter((message) => message.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-root" role="status" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className="toast-message">
            {message.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
