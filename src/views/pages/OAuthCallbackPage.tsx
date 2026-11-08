import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import logo from '../../../assets/images/logo.png'
import {
  completeXAuth,
  normalizeXHandle,
  saveXConnection,
} from '../../controllers/ambassadorAuth.ts'
import './SignupPage.css'

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const oauthError = searchParams.get('error')

    if (oauthError) {
      setError('X authorization was cancelled. Try connecting again.')
      return
    }

    if (!code || !state) {
      setError('Missing X authorization details. Start Connect with X again.')
      return
    }

    let cancelled = false

    async function finish() {
      try {
        const data = await completeXAuth(code!, state!)
        if (cancelled) return

        const username = (data.username || data.x_handle || '').replace(/^@/, '')
        saveXConnection({
          connectionToken: data.connection_token,
          xHandle: data.x_handle
            ? normalizeXHandle(data.x_handle)
            : username
              ? normalizeXHandle(username)
              : undefined,
          username: username || undefined,
          displayName: data.display_name,
          avatarUrl: data.avatar_url,
        })

        navigate('/sign-up?x=connected', { replace: true })
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof Error
            ? err.message
            : 'Could not complete X connection. Try again.',
        )
      }
    }

    void finish()

    return () => {
      cancelled = true
    }
  }, [navigate, searchParams])

  return (
    <main className="signup">
      <section className="signup-card">
        <img className="signup-logo" src={logo} alt="SenseiFi" />
        <h1>{error ? 'X connection failed' : 'Connecting X…'}</h1>
        <p className="signup-lead">
          {error
            ? error
            : 'Finishing your X authorization. You will return to signup next.'}
        </p>
        {error ? (
          <div className="signup-actions">
            <Link className="signup-submit" to="/sign-up">
              Back to sign up
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  )
}
