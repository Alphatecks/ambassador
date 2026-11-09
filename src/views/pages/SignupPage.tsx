import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/images/logo.png'
import {
  clearSignupDraft,
  clearXConnection,
  consumeSignupError,
  enterDashboardAfterSignup,
  enterDashboardFromXConnection,
  finishSignupAndEnterDashboard,
  normalizeXHandle,
  readAmbassadorSession,
  readSignupDraft,
  readXConnection,
  saveSignupDraft,
  startXAuth,
} from '../../controllers/ambassadorAuth.ts'
import {
  getOAuthHandoffUrl,
  needsOAuthHandoff,
} from '../../controllers/oauthDevHandoff.ts'
import { useAmbassador } from '../../providers/AmbassadorContext.tsx'
import { useToast } from '../../providers/ToastContext.tsx'
import './SignupPage.css'

const emptyForm = {
  email: '',
  xHandle: '',
  password: '',
}

type SignupField = keyof typeof emptyForm

export function SignupPage() {
  const navigate = useNavigate()
  const { clearSession } = useAmbassador()
  const { showToast } = useToast()
  const [form, setForm] = useState(emptyForm)
  const [connectionToken, setConnectionToken] = useState('')
  const [xConnected, setXConnected] = useState(false)
  const [xError, setXError] = useState('')
  const [formError, setFormError] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showEmailBackup, setShowEmailBackup] = useState(false)
  const [minFollowers, setMinFollowers] = useState<number | null>(null)

  useEffect(() => {
    if (readAmbassadorSession()) {
      enterDashboardAfterSignup()
      return
    }

    const pendingError = consumeSignupError()
    if (pendingError) {
      if (/valid email|email/i.test(pendingError)) setShowEmailBackup(true)
      setFormError(pendingError)
      showToast({ message: pendingError, tone: 'error' })
    }

    const draft = readSignupDraft()
    if (draft) {
      setForm({
        email: draft.email,
        xHandle: draft.xHandle,
        password: draft.password,
      })
      if (draft.email || draft.password) setShowEmailBackup(true)
    }

    const connection = readXConnection()
    if (!connection?.connectionToken) return

    setConnectionToken(connection.connectionToken)
    setXConnected(true)
    setXError('')
    if (connection.xHandle || connection.username) {
      setForm(current => ({
        ...current,
        xHandle:
          connection.xHandle ||
          (connection.username ? `@${connection.username}` : current.xHandle),
      }))
    }
  }, [showToast])

  function update(field: SignupField) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target
      setForm(current => ({ ...current, [field]: value }))
      setFormError('')
    }
  }

  function onCancel() {
    setForm(emptyForm)
    setConnectionToken('')
    setXConnected(false)
    setXError('')
    setFormError('')
    setMinFollowers(null)
    setShowEmailBackup(false)
    clearSignupDraft()
    clearXConnection()
    clearSession()
    navigate('/')
  }

  async function connectWithX() {
    setConnecting(true)
    setXError('')
    setFormError('')

    try {
      saveSignupDraft(form)

      if (needsOAuthHandoff()) {
        window.location.assign(getOAuthHandoffUrl(window.location.origin, 'signup'))
        return
      }

      const data = await startXAuth('signup')
      if (data.min_followers) setMinFollowers(data.min_followers)
      window.location.assign(data.authorize_url)
    } catch (err) {
      setConnecting(false)
      setXError(
        err instanceof Error ? err.message : 'Could not start X connection.',
      )
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setXError('')

    if (!connectionToken || !xConnected) {
      setXError('Connect with X to continue')
      return
    }

    setSubmitting(true)
    try {
      saveSignupDraft(form)

      if (form.email.trim() || form.password) {
        await finishSignupAndEnterDashboard({
          connectionToken,
          xHandle: normalizeXHandle(form.xHandle) || undefined,
          email: form.email.trim() || undefined,
          password: form.password || undefined,
        })
        return
      }

      // Exchange X connection_token for a real bearer session, then open overview.
      await enterDashboardFromXConnection()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Sign up failed. Try again.'
      if (/valid email|email/i.test(message)) {
        setShowEmailBackup(true)
      }
      setFormError(message)
      showToast({ message, tone: 'error' })
      setSubmitting(false)
    }
  }

  return (
    <main className="signup">
      <form className="signup-card" onSubmit={onSubmit}>
        <img className="signup-logo" src={logo} alt="SenseiFi" />
        <h1>Sign up as an ambassador</h1>
        <p className="signup-lead">
          Sign up with X to open your dashboard
          {minFollowers ? ` · ${minFollowers.toLocaleString()}+ followers required` : ''}
        </p>

        <div className="signup-fields">
          <div className="signup-field signup-connect">
            <span className="signup-connect-label">X account</span>
            <button
              className={xConnected ? 'signup-x is-connected' : 'signup-x'}
              type="button"
              onClick={connectWithX}
              aria-pressed={xConnected}
              disabled={connecting || submitting}
            >
              <XMark />
              {connecting
                ? 'Redirecting to X…'
                : xConnected
                  ? 'Connected with X'
                  : 'Sign up with X'}
            </button>
            {xError ? (
              <p className="signup-error" role="alert">
                {xError}
              </p>
            ) : null}
          </div>

          <button
            className="signup-backup-toggle"
            type="button"
            onClick={() => setShowEmailBackup(open => !open)}
          >
            {showEmailBackup ? 'Hide email backup' : 'Add email backup (if required)'}
          </button>

          {showEmailBackup ? (
            <>
              <Field
                id="email"
                label="Email"
                type="email"
                placeholder="Enter email"
                autoComplete="email"
                value={form.email}
                onChange={update('email')}
                disabled={submitting || connecting}
                required={false}
              />
              <Field
                id="xHandle"
                label="X handle"
                placeholder="@username"
                autoComplete="username"
                value={form.xHandle}
                onChange={update('xHandle')}
                disabled={submitting || connecting}
                required={false}
              />
              <Field
                id="password"
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={update('password')}
                disabled={submitting || connecting}
                minLength={8}
                required={false}
              />
            </>
          ) : null}

          {formError ? (
            <p className="signup-error" role="alert">
              {formError}
            </p>
          ) : null}
        </div>

        <div className="signup-actions">
          <button
            className="signup-cancel"
            type="button"
            onClick={onCancel}
            disabled={connecting || submitting}
          >
            Cancel
          </button>
          {xConnected ? (
            <button
              className="signup-submit"
              type="submit"
              disabled={connecting || submitting}
            >
              {submitting ? 'Opening dashboard…' : 'Continue to dashboard'}
            </button>
          ) : (
            <button
              className="signup-submit"
              type="button"
              onClick={connectWithX}
              disabled={connecting || submitting}
            >
              {connecting ? 'Redirecting…' : 'Continue with X'}
            </button>
          )}
        </div>

        <p className="signup-switch">
          Already have an account ? <Link to="/sign-in">Sign in</Link>
        </p>
      </form>
    </main>
  )
}

function Field({
  id,
  label,
  type = 'text',
  placeholder,
  autoComplete,
  value,
  onChange,
  disabled,
  minLength,
  required = true,
}: {
  id: string
  label: string
  type?: string
  placeholder: string
  autoComplete: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  minLength?: number
  required?: boolean
}) {
  return (
    <div className="signup-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        minLength={minLength}
      />
    </div>
  )
}

function XMark() {
  return (
    <svg
      className="signup-x-icon"
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
