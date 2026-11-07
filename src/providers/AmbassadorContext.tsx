import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import avatar from '../../assets/images/ambassador-avatar.jpg'

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
  connectWallet: () => void
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

export function AmbassadorProvider({ children }: { children: ReactNode }) {
  const [xProfile, setXProfile] = useState<XProfile | null>(null)
  const [wallet, setWallet] = useState<WalletAccount | null>(null)

  const value = useMemo<AmbassadorContextValue>(
    () => ({
      xProfile,
      wallet,
      connectX(profile) {
        setXProfile({
          ...defaultXProfile,
          ...profile,
          username: (profile?.username ?? defaultXProfile.username).replace(
            /^@/,
            '',
          ),
        })
      },
      connectWallet() {
        setWallet(defaultWallet)
      },
      disconnectWallet() {
        setWallet(null)
      },
      clearSession() {
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
