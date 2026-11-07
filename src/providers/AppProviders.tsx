import type { ReactNode } from 'react'
import { AmbassadorProvider } from './AmbassadorContext.tsx'

export function AppProviders({ children }: { children: ReactNode }) {
  return <AmbassadorProvider>{children}</AmbassadorProvider>
}
