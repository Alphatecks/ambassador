import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import logo from '../../../assets/images/logo.png'
import {
  clearSignupDraft,
  clearXConnection,
  normalizeXHandle,
  readSignupDraft,
  readXConnection,
  saveSignupDraft,
  signupAmbassador,
  startXAuth,
} from '../../controllers/ambassadorAuth.ts'
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
  const [searchParams] = useSearchParams()
  const { connectX, clearSession } = useAmbassador()
  const { showToast } = useToast()
  const [form, setForm] = useState(emptyForm)
  const [connectionToken, setConnectionToken] = useState('')
  const [xConnected, setXConnected] = useState(false)
  const [xError, setXError] = useState('')
  const [formError, setFormError] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [minFollowers, setMinFollowers] = useState<number | null>(null)

  useEffect(() => {
    const draft = readSignupDraft()
    if (draft) {
      setForm({
        email: draft.email,
        xHandle: draft.xHandle,
        password: draft.password,
      })
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
  }, [])

  useEffect(() => {
    if (searchParams.get('x') === 'connected' && !readXConnection()?.connectionToken) {
      setXError('X connection was not saved. Connect with X again.')
    }
  }, [searchParams])

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
      const data = await startXAuth()
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

    const handle = normalizeXHandle(form.xHandle)
    if (!handle) {
      setFormError('Enter your X handle')
      return
    }

    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters')
      return
    }

    setSubmitting(true)
    try {
      const result = await signupAmbassador({
        email: form.email.trim(),
        password: form.password,
        x_handle: handle,
        connection_token: connectionToken,
      })

      const username =
        result.data.ambassador?.username ||
        result.data.user?.username ||
        result.data.ambassador?.x_handle ||
        result.data.user?.x_handle ||
        handle

      clearSignupDraft()
      clearXConnection()

      connectX({
        username: username.replace(/^@/, ''),
        displayName: result.data.ambassador?.display_name,
        avatarUrl: result.data.ambassador?.avatar_url,
      })

      showToast({ message: result.message, tone: 'success' })
      navigate('/overview', {
        replace: true,
        state: { showQualification: true },
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Sign up failed. Try again.'
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
          Connect with X first, then finish with email and password
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
                  : 'Connect with X'}
            </button>
            {xError ? (
              <p className="signup-error" role="alert">
                {xError}
              </p>
            ) : null}
          </div>

          <Field
            id="email"
            label="Email"
            type="email"
            placeholder="Enter email"
            autoComplete="email"
            value={form.email}
            onChange={update('email')}
            disabled={submitting}
          />
          <Field
            id="xHandle"
            label="X handle"
            placeholder="@username"
            autoComplete="username"
            value={form.xHandle}
            onChange={update('xHandle')}
            disabled={submitting}
          />
          <Field
            id="password"
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
            disabled={submitting}
            minLength={8}
          />
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
          <button className="signup-submit" type="submit" disabled={connecting || submitting}>
            {submitting ? 'Creating account…' : 'Sign Up'}
          </button>
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
        required
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
