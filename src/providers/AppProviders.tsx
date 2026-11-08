import type { ReactNode } from 'react'
import { AmbassadorProvider } from './AmbassadorContext.tsx'
import { ToastProvider } from './ToastContext.tsx'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AmbassadorProvider>{children}</AmbassadorProvider>
    </ToastProvider>
  )
}
