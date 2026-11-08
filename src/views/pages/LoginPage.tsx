import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/images/logo.png'
import { useAmbassador } from '../../providers/AmbassadorContext.tsx'
import './LoginPage.css'

const emptyForm = {
  email: '',
  password: '',
}

type LoginField = keyof typeof emptyForm

export function LoginPage() {
  const navigate = useNavigate()
  const { connectX } = useAmbassador()
  const [form, setForm] = useState(emptyForm)

  function update(field: LoginField) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target
      setForm(current => ({ ...current, [field]: value }))
    }
  }

  function enterApp() {
    navigate('/overview', { state: { showQualification: true } })
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    connectX()
    enterApp()
  }

  function connectWithX() {
    connectX()
    enterApp()
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={onSubmit}>
        <img className="login-logo" src={logo} alt="SenseiFi" />
        <h1>Welcome back</h1>
        <p className="login-lead">
          Sign in with X, or use email as a backup
        </p>

        <div className="login-fields">
          <div className="login-field login-connect">
            <span className="login-connect-label">X account</span>
            <button className="login-x" type="button" onClick={connectWithX}>
              <XMark />
              Sign in with X
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
            />
          </div>
        </div>

        <button className="login-submit" type="submit">
          Sign in
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
