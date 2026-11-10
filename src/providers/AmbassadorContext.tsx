import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import avatar from '../../assets/images/ambassador-avatar.jpg'
import {
  clearAmbassadorSession,
  readAmbassadorSession,
  saveAmbassadorSession,
} from '../controllers/ambassadorAuth.ts'

export type XProfile = {
  username: string
  displayName: string
  avatarUrl: string
}

export type WalletAccount = {
  address: string
  label: string
}

type AmbassadorContextValue = {
  xProfile: XProfile | null
  wallet: WalletAccount | null
  connectX: (profile?: Partial<XProfile>) => void
  connectWallet: (account?: Partial<WalletAccount>) => void
  disconnectWallet: () => void
  clearSession: () => void
}

const defaultXProfile: XProfile = {
  username: 'kaioka',
  displayName: 'Kai Oka',
  avatarUrl: avatar,
}

const defaultWallet: WalletAccount = {
  address: '0xA1b2C3d4E5f678901234567890abcdef12345678',
  label: 'SenseiFi wallet',
}

const AmbassadorContext = createContext<AmbassadorContextValue | null>(null)

export function shortenAddress(address: string) {
  if (address.length < 10) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

function profileFromSession(): XProfile | null {
  const session = readAmbassadorSession()
  if (!session?.username && !session?.email) return null
  return {
    username: (session.username || defaultXProfile.username).replace(/^@/, ''),
    displayName: session.displayName || defaultXProfile.displayName,
    avatarUrl: session.avatarUrl || defaultXProfile.avatarUrl,
  }
}

export function AmbassadorProvider({ children }: { children: ReactNode }) {
  const [xProfile, setXProfile] = useState<XProfile | null>(() =>
    profileFromSession(),
  )
  const [wallet, setWallet] = useState<WalletAccount | null>(null)

  const value = useMemo<AmbassadorContextValue>(
    () => ({
      xProfile,
      wallet,
      connectX(profile) {
        const next = {
          ...defaultXProfile,
          ...profile,
          username: (profile?.username ?? defaultXProfile.username).replace(
            /^@/,
            '',
          ),
        }
        setXProfile(next)
        const existing = readAmbassadorSession()
        saveAmbassadorSession({
          ...existing,
          username: next.username,
          displayName: next.displayName,
          avatarUrl: next.avatarUrl,
        })
      },
      connectWallet(account) {
        setWallet({
          address: account?.address?.trim() || defaultWallet.address,
          label: account?.label?.trim() || defaultWallet.label,
        })
      },
      disconnectWallet() {
        setWallet(null)
      },
      clearSession() {
        clearAmbassadorSession()
        setXProfile(null)
        setWallet(null)
      },
    }),
    [xProfile, wallet],
  )

  return (
    <AmbassadorContext.Provider value={value}>{children}</AmbassadorContext.Provider>
  )
}

export function useAmbassador() {
  const context = useContext(AmbassadorContext)
  if (!context) {
    throw new Error('useAmbassador must be used within AmbassadorProvider')
  }
  return context
}

export { defaultXProfile, defaultWallet }
