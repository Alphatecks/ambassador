import { useEffect, useState } from 'react'
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import logo from '../../../assets/images/logo.png'
import { withdraw } from '../../models/withdraw.ts'
import {
  shortenAddress,
  useAmbassador,
} from '../../providers/AmbassadorContext.tsx'
import { useToast } from '../../providers/ToastContext.tsx'
import { QualificationModal } from '../components/QualificationModal.tsx'
import './DashboardShell.css'

function dollars(amount: number) {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

type DashboardLocationState = {
  showQualification?: boolean
}

export function DashboardShell() {
  const { clearSession, wallet, connectWallet, disconnectWallet } = useAmbassador()
  const { showToast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [qualificationOpen, setQualificationOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const state = location.state as DashboardLocationState | null
    const welcomed = searchParams.get('welcome') === '1'
    if (!state?.showQualification && !welcomed) return

    setQualificationOpen(true)
    if (welcomed) {
      showToast({
        message: 'Account created. Welcome aboard.',
        tone: 'success',
      })
    }
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate, searchParams, showToast])

  useEffect(() => {
    if (!menuOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  function logOut() {
    setMenuOpen(false)
    clearSession()
    navigate('/sign-in', { replace: true })
  }

  return (
    <div className={menuOpen ? 'dashboard is-menu-open' : 'dashboard'}>
      <header className="mobile-bar">
        <div className="sidebar-brand">
          <img src={logo} alt="" />
          <span>SenseiFi Ambassadors</span>
        </div>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="ambassadors-menu"
          onClick={() => setMenuOpen(open => !open)}
        >
          <span className="menu-toggle-bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
        </button>
      </header>

      <button
        type="button"
        className="menu-backdrop"
        aria-label="Close menu"
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />

      <aside className="sidebar" id="ambassadors-menu">
        <div className="sidebar-brand">
          <img src={logo} alt="" />
          <span>SenseiFi Ambassadors</span>
        </div>
        <nav className="sidebar-nav" aria-label="Ambassadors" onClick={() => setMenuOpen(false)}>
          <NavLink
            to="/overview"
            className={({ isActive }) =>
              isActive ? 'sidebar-link is-active' : 'sidebar-link'
            }
          >
            Overview
          </NavLink>
          <NavLink
            to="/referrals"
            className={({ isActive }) =>
              isActive ? 'sidebar-link is-active' : 'sidebar-link'
            }
          >
            Referrals
          </NavLink>
          <NavLink
            to="/marketing"
            className={({ isActive }) =>
              isActive ? 'sidebar-link is-active' : 'sidebar-link'
            }
          >
            Marketing
          </NavLink>
          <NavLink
            to="/x-reach"
            className={({ isActive }) =>
              isActive ? 'sidebar-link is-active' : 'sidebar-link'
            }
          >
            X Reach
          </NavLink>
          <NavLink
            to="/rewards"
            className={({ isActive }) =>
              isActive ? 'sidebar-link is-active' : 'sidebar-link'
            }
          >
            Rewards
          </NavLink>
          <NavLink
            to="/withdraw"
            className={({ isActive }) =>
              isActive ? 'sidebar-link is-active' : 'sidebar-link'
            }
          >
            Withdraw
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <NavLink to="/withdraw" className="sidebar-balance" onClick={() => setMenuOpen(false)}>
            <span className="sidebar-wallet-label">Available balance</span>
            <span className="sidebar-balance-value">{dollars(withdraw.available)}</span>
          </NavLink>
          {wallet ? (
            <button
              type="button"
              className="sidebar-wallet is-connected"
              onClick={disconnectWallet}
              title={wallet.address}
            >
              <span className="sidebar-wallet-label">Wallet</span>
              <span className="sidebar-wallet-value">
                {shortenAddress(wallet.address)}
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="sidebar-wallet"
              onClick={connectWallet}
            >
              Connect wallet
            </button>
          )}
          <button type="button" className="sidebar-logout" onClick={logOut}>
            Log out
          </button>
        </div>
      </aside>
      <div className="dashboard-main">
        <Outlet />
      </div>
      {qualificationOpen ? (
        <QualificationModal onClose={() => setQualificationOpen(false)} />
      ) : null}
    </div>
  )
}
