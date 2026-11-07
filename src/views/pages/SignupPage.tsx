import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/images/logo.png'
import { useAmbassador } from '../../providers/AmbassadorContext.tsx'
import './SignupPage.css'

const emptyForm = {
  email: '',
  password: '',
}

type SignupField = keyof typeof emptyForm

export function SignupPage() {
  const navigate = useNavigate()
  const { connectX, clearSession } = useAmbassador()
  const [form, setForm] = useState(emptyForm)
  const [xConnected, setXConnected] = useState(false)
  const [xError, setXError] = useState(false)

  function update(field: SignupField) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target
      setForm(current => ({ ...current, [field]: value }))
    }
  }

  function enterApp() {
    navigate('/overview', { state: { showQualification: true } })
  }

  function onCancel() {
    setForm(emptyForm)
    setXConnected(false)
    setXError(false)
    clearSession()
  }

  function connectWithX() {
    connectX()
    setXConnected(true)
    setXError(false)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!xConnected) {
      setXError(true)
      return
    }
    enterApp()
  }

  return (
    <main className="signup">
      <form className="signup-card" onSubmit={onSubmit}>
        <img className="signup-logo" src={logo} alt="SenseiFi" />
        <h1>Sign up as an ambassador</h1>
        <p className="signup-lead">
          Connect your X account, then add email for backup login
        </p>

        <div className="signup-fields">
          <div className="signup-field signup-connect">
            <span className="signup-connect-label">X account</span>
            <button
              className={xConnected ? 'signup-x is-connected' : 'signup-x'}
              type="button"
              onClick={connectWithX}
              aria-pressed={xConnected}
            >
              <XMark />
              {xConnected ? 'Connected with X' : 'Connect with X'}
            </button>
            {xError ? (
              <p className="signup-error" role="alert">
                Connect with X to continue
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
          />
          <Field
            id="password"
            label="Password"
            type="password"
            placeholder="Enter password"
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
          />
        </div>

        <div className="signup-actions">
          <button className="signup-cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="signup-submit" type="submit">
            Sign Up
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
}: {
  id: string
  label: string
  type?: string
  placeholder: string
  autoComplete: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
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
