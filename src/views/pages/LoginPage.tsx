import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../../../assets/images/logo.png'
import {
  clearSignupDraft,
  consumeSignupError,
  enterDashboardAfterLogin,
  loginAmbassador,
  readAmbassadorSession,
  saveAmbassadorSession,
  saveSignupDraft,
  startXAuth,
} from '../../controllers/ambassadorAuth.ts'
import { useAmbassador } from '../../providers/AmbassadorContext.tsx'
import { useToast } from '../../providers/ToastContext.tsx'
import './LoginPage.css'

const emptyForm = {
  email: '',
  password: '',
}

type LoginField = keyof typeof emptyForm

type LoginLocationState = {
  email?: string
}

export function LoginPage() {
  const location = useLocation()
  const { connectX } = useAmbassador()
  const { showToast } = useToast()
  const incoming = (location.state as LoginLocationState | null)?.email ?? ''
  const [form, setForm] = useState({
    ...emptyForm,
    email: incoming,
  })
  const [connecting, setConnecting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (readAmbassadorSession()) {
      enterDashboardAfterLogin()
      return
    }

    const pendingError = consumeSignupError()
    if (pendingError) {
      setError(pendingError)
      showToast({ message: pendingError, tone: 'error' })
    }
  }, [showToast])

  function update(field: LoginField) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target
      setForm(current => ({ ...current, [field]: value }))
      setError('')
    }
  }

  async function connectWithX() {
    setConnecting(true)
    setError('')
    try {
      saveSignupDraft({
        email: form.email,
        password: form.password,
        xHandle: '',
      })

      const data = await startXAuth('login')
      window.location.assign(data.authorize_url)
    } catch (err) {
      setConnecting(false)
      const message =
        err instanceof Error ? err.message : 'Could not start X sign in.'
      setError(message)
      showToast({ message, tone: 'error' })
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const result = await loginAmbassador({
        email: form.email.trim(),
        password: form.password,
      })
      const username = (
        result.data.ambassador?.username ||
        result.data.user?.username ||
        result.data.ambassador?.x_handle ||
        result.data.user?.x_handle ||
        ''
      ).replace(/^@/, '')
      saveAmbassadorSession({
        email: form.email.trim(),
        username: username || undefined,
        displayName: result.data.ambassador?.display_name,
        avatarUrl: result.data.ambassador?.avatar_url,
        token: result.data.token || result.data.access_token,
      })
      connectX({
        username: username || undefined,
        displayName: result.data.ambassador?.display_name,
        avatarUrl: result.data.ambassador?.avatar_url,
      })
      clearSignupDraft()
      showToast({ message: result.message, tone: 'success' })
      enterDashboardAfterLogin()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Sign in failed. Try again.'
      setError(message)
      showToast({ message, tone: 'error' })
      setSubmitting(false)
    }
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={onSubmit}>
        <img className="login-logo" src={logo} alt="SenseiFi" />
        <h1>Welcome back</h1>
        <p className="login-lead">Sign in with X, or use email as a backup</p>

        <div className="login-fields">
          <div className="login-field login-connect">
            <span className="login-connect-label">X account</span>
            <button
              className="login-x"
              type="button"
              onClick={connectWithX}
              disabled={connecting || submitting}
            >
              <XMark />
              {connecting ? 'Redirecting to X…' : 'Sign in with X'}
            </button>
          </div>

          <div className="login-divider" role="separator">
            <span>or</span>
          </div>

          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter email"
              value={form.email}
              onChange={update('email')}
              required
              disabled={submitting || connecting}
            />
          </div>
          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={form.password}
              onChange={update('password')}
              required
              disabled={submitting || connecting}
            />
          </div>
          {error ? (
            <p className="login-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <button className="login-submit" type="submit" disabled={submitting || connecting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="login-switch">
          Don't have an account ? <Link to="/sign-up">Sign Up</Link>
        </p>
      </form>
    </main>
  )
}

function XMark() {
  return (
    <svg
      className="login-x-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L5.2 22H1.94l8.03-9.17L1.5 2h6.75l4.66 6.16L18.244 2Zm-1.16 18.12h1.83L7.03 3.78H5.07l12.014 16.34Z"
      />
    </svg>
  )
}
