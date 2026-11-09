import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import logo from '../../../assets/images/logo.png'
import {
  saveOAuthIntent,
  startXAuth,
  type XAuthIntent,
} from '../../controllers/ambassadorAuth.ts'
import {
  isAllowedLocalReturnOrigin,
  saveLocalOAuthReturn,
} from '../../controllers/oauthDevHandoff.ts'
import './SignupPage.css'

export function OAuthDevHandoffPage() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const intent: XAuthIntent =
    searchParams.get('intent') === 'login' ? 'login' : 'signup'

  useEffect(() => {
    const returnOrigin = searchParams.get('return')?.trim() || ''

    if (!returnOrigin || !isAllowedLocalReturnOrigin(returnOrigin)) {
      setError(
        'Local OAuth handoff only accepts http://localhost or http://127.0.0.1 return URLs.',
      )
      return
    }

    saveLocalOAuthReturn(returnOrigin)
    saveOAuthIntent(intent)

    let active = true

    async function begin() {
      try {
        const data = await startXAuth(intent)
        if (!active) return
        window.location.assign(data.authorize_url)
      } catch (err) {
        if (!active) return
        setError(
          err instanceof Error
            ? err.message
            : 'Could not start X connection from the production handoff.',
        )
      }
    }

    void begin()

    return () => {
      active = false
    }
  }, [intent, searchParams])

  return (
    <main className="signup">
      <section className="signup-card">
        <img className="signup-logo" src={logo} alt="SenseiFi" />
        <h1>{error ? 'Local X handoff failed' : 'Starting X for local dev…'}</h1>
        <p className="signup-lead">
          {error
            ? 'We could not bridge Connect with X back to your localhost app.'
            : 'Saving your local return URL, then sending you to X. After approval you will return to localhost.'}
        </p>
        {error ? (
          <>
            <p className="signup-error signup-error-block" role="alert">
              <span className="signup-error-label">Reason</span>
              {error}
            </p>
            <div className="signup-actions">
              <Link
                className="signup-submit"
                to={intent === 'login' ? '/sign-in' : '/sign-up'}
              >
                {intent === 'login' ? 'Back to sign in' : 'Back to sign up'}
              </Link>
            </div>
          </>
        ) : null}
      </section>
    </main>
  )
}
