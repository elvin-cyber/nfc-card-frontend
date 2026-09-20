import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const remove = (id) => setToasts((items) => items.filter((item) => item.id !== id));
  const push = (message, type = "error") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((items) => [...items, { id, message, type }]);
    window.setTimeout(() => remove(id), 4200);
  };
  useEffect(() => {
    const onToast = (event) => push(event.detail?.message || "Something went wrong.", event.detail?.type || "error");
    window.addEventListener("nfc:toast", onToast);
    return () => window.removeEventListener("nfc:toast", onToast);
  }, []);
  const value = useMemo(() => ({ push, remove }), []);
  return <ToastContext.Provider value={value}>{children}
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => <div className={`toast toast-${toast.type}`} key={toast.id}>
        {toast.type === "success" ? <CheckCircle2 size={18}/> : toast.type === "info" ? <Info size={18}/> : <AlertCircle size={18}/>} 
        <span>{toast.message}</span><button onClick={() => remove(toast.id)} aria-label="Close"><X size={15}/></button>
      </div>)}
    </div>
  </ToastContext.Provider>;
}
export function useToast() { return useContext(ToastContext); }
