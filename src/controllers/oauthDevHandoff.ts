import { env } from '../config/env.ts'

const LOCAL_RETURN_KEY = 'senseifi.oauth.localReturn'

/** Only bounce OAuth codes back to local HTTP origins. */
export function isAllowedLocalReturnOrigin(value: string) {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    )
  } catch {
    return false
  }
}

export function isLocalDevOrigin(origin = window.location.origin) {
  return isAllowedLocalReturnOrigin(origin)
}

export function needsOAuthHandoff(origin = window.location.origin) {
  return origin !== env.oauthHandoffOrigin && isLocalDevOrigin(origin)
}

export function getOAuthHandoffUrl(returnOrigin = window.location.origin) {
  const url = new URL('/oauth/dev-handoff', `${env.oauthHandoffOrigin}/`)
  url.searchParams.set('return', returnOrigin)
  return url.toString()
}

export function saveLocalOAuthReturn(returnOrigin: string) {
  if (!isAllowedLocalReturnOrigin(returnOrigin)) return false
  localStorage.setItem(LOCAL_RETURN_KEY, returnOrigin)
  return true
}

export function readLocalOAuthReturn() {
  const value = localStorage.getItem(LOCAL_RETURN_KEY)
  if (!value || !isAllowedLocalReturnOrigin(value)) return null
  return value
}

export function clearLocalOAuthReturn() {
  localStorage.removeItem(LOCAL_RETURN_KEY)
}

/**
 * If this production callback was started from localhost, send code/state back
 * so complete + signup draft stay on the local app.
 */
export function bounceOAuthCallbackToLocalDev(search: string) {
  const returnOrigin = readLocalOAuthReturn()
  if (!returnOrigin) return false
  if (window.location.origin === returnOrigin) {
    clearLocalOAuthReturn()
    return false
  }

  clearLocalOAuthReturn()
  const params = new URLSearchParams(search)
  const target = new URL('/oauth/callback', `${returnOrigin}/`)
  params.forEach((value, key) => {
    target.searchParams.set(key, value)
  })
  window.location.replace(target.toString())
  return true
}
