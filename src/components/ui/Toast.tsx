import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToastItem {
  id: number;
  title: string;
  body?: string;
  variant?: 'default' | 'success' | 'error';
}

interface ToastContextValue {
  showToast: (title: string, body?: string, variant?: ToastItem['variant']) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback(
    (title: string, body?: string, variant: ToastItem['variant'] = 'default') => {
      const id = ++counterRef.current;
      setToasts((prev) => [...prev, { id, title, body, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 w-80 rounded-xl border px-4 py-3 shadow-lg',
              'animate-in slide-in-from-bottom-4 duration-300',
              toast.variant === 'success' && 'bg-green-50 border-green-200',
              toast.variant === 'error'   && 'bg-red-50 border-red-200',
              (!toast.variant || toast.variant === 'default') && 'bg-card border-border'
            )}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{toast.title}</p>
              {toast.body && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{toast.body}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
