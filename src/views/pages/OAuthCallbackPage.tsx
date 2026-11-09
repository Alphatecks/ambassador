import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import logo from '../../../assets/images/logo.png'
import {
  completeXAuth,
  draftIsReadyForSignup,
  finishSignupAndEnterDashboard,
  normalizeXHandle,
  readSignupDraft,
  readXConnection,
  saveSignupError,
  saveXConnection,
} from '../../controllers/ambassadorAuth.ts'
import { bounceOAuthCallbackToLocalDev } from '../../controllers/oauthDevHandoff.ts'
import { useToast } from '../../providers/ToastContext.tsx'
import './SignupPage.css'

function describeOAuthFailure(
  oauthError: string | null,
  oauthDescription: string | null,
) {
  const detail = oauthDescription?.trim()
  if (detail) return detail

  switch (oauthError) {
    case 'access_denied':
      return 'You cancelled X authorization. Connect with X again to continue.'
    case 'server_error':
      return 'X had a server error during authorization. Try again in a moment.'
    case 'temporarily_unavailable':
      return 'X is temporarily unavailable. Try again in a moment.'
    default:
      return oauthError
        ? `X authorization failed (${oauthError}). Try connecting again.`
        : 'X authorization failed. Try connecting again.'
  }
}

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Finishing your X authorization…')

  useEffect(() => {
    if (bounceOAuthCallbackToLocalDev(window.location.search)) {
      setStatus('Sending X authorization back to your local app…')
      return
    }

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const oauthError = searchParams.get('error')
    const oauthDescription = searchParams.get('error_description')

    if (oauthError) {
      const message = describeOAuthFailure(oauthError, oauthDescription)
      setError(message)
      showToast({ message, tone: 'error' })
      return
    }

    if (!code || !state) {
      const message =
        'Missing X authorization code or state in the callback URL. Start Connect with X again from sign up.'
      setError(message)
      showToast({ message, tone: 'error' })
      return
    }

    let active = true

    async function finish() {
      try {
        setStatus('Confirming your X account with SenseiFi…')
        const data = await completeXAuth(code!, state!)
        if (!active) return

        const username = (data.username || data.x_handle || '').replace(/^@/, '')
        const xHandle = data.x_handle
          ? normalizeXHandle(data.x_handle)
          : username
            ? normalizeXHandle(username)
            : undefined

        saveXConnection({
          connectionToken: data.connection_token,
          xHandle,
          username: username || undefined,
          displayName: data.display_name,
          avatarUrl: data.avatar_url,
        })

        const draft = readSignupDraft()
        if (draftIsReadyForSignup(draft)) {
          setStatus('Creating your ambassador account…')
          await finishSignupAndEnterDashboard({
            email: draft!.email,
            password: draft!.password,
            xHandle: xHandle || draft!.xHandle,
            connectionToken: data.connection_token,
            profile: {
              username: username || undefined,
              displayName: data.display_name,
              avatarUrl: data.avatar_url,
            },
          })
          return
        }

        setStatus('X connected. Returning to sign up…')
        navigate('/sign-up?x=connected', { replace: true })
      } catch (err) {
        if (!active) return
        const message =
          err instanceof Error
            ? err.message
            : 'Could not complete X connection. Try again.'

        // X may already be linked; keep them on the form with the real error.
        if (readXConnection()?.connectionToken || readSignupDraft()) {
          saveSignupError(message)
          showToast({ message, tone: 'error' })
          navigate('/sign-up?x=connected', { replace: true })
          return
        }

        setError(message)
        showToast({ message, tone: 'error' })
      }
    }

    void finish()

    return () => {
      active = false
    }
  }, [navigate, searchParams, showToast])

  return (
    <main className="signup">
      <section className="signup-card">
        <img className="signup-logo" src={logo} alt="SenseiFi" />
        <h1>{error ? 'X connection failed' : 'Connecting X…'}</h1>
        <p className="signup-lead">
          {error
            ? 'We could not finish linking your X account.'
            : status}
        </p>
        {error ? (
          <>
            <p className="signup-error signup-error-block" role="alert">
              <span className="signup-error-label">Reason</span>
              {error}
            </p>
            <div className="signup-actions">
              <Link className="signup-submit" to="/sign-up">
                Back to sign up
              </Link>
            </div>
          </>
        ) : null}
      </section>
    </main>
  )
}
