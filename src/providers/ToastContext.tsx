import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import './Toast.css'

export type ToastTone = 'success' | 'error' | 'info'

export type ToastInput = {
  message: string
  tone?: ToastTone
  durationMs?: number
}

type ToastItem = {
  id: number
  message: string
  tone: ToastTone
}

type ToastContextValue = {
  showToast: (input: ToastInput | string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts(current => current.filter(toast => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (input: ToastInput | string) => {
      const next: ToastItem = {
        id: ++toastId,
        message: typeof input === 'string' ? input : input.message,
        tone: typeof input === 'string' ? 'info' : (input.tone ?? 'info'),
      }
      const durationMs =
        typeof input === 'string' ? 4200 : (input.durationMs ?? 4200)

      setToasts(current => [...current, next])
      window.setTimeout(() => dismiss(next.id), durationMs)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-relevant="additions">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast toast-${toast.tone}`}
            role="status"
          >
            <p>{toast.message}</p>
            <button
              type="button"
              className="toast-dismiss"
              aria-label="Dismiss"
              onClick={() => dismiss(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
