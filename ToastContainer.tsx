import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { ToastMessage } from '../types';

const ICON_MAP = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLOR_MAP: Record<ToastMessage['type'], string> = {
  success: 'border-success/40 bg-success/10',
  error: 'border-destructive/40 bg-destructive/10',
  info: 'border-primary/40 bg-primary/10',
  warning: 'border-warning/40 bg-warning/10',
};

const ICON_COLOR: Record<ToastMessage['type'], string> = {
  success: 'text-success',
  error: 'text-destructive',
  info: 'text-primary',
  warning: 'text-warning',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const Icon = ICON_MAP[toast.type];
        return (
          <div
            key={toast.id}
            className={`animate-slide-up pointer-events-auto glass border rounded-xl p-4 flex items-start gap-3 shadow-lg ${COLOR_MAP[toast.type]}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${ICON_COLOR[toast.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{toast.title}</p>
              {toast.message && <p className="text-xs text-text-muted mt-0.5">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-dim hover:text-foreground transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
