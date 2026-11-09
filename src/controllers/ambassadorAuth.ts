import { apiConfig } from '../config/api.ts'

type ApiSuccess<T> = {
  success?: boolean
  data?: T
  message?: string
  path?: string
  redirect?: string
  next?: string
  error?: string
}

type ApiFailure = {
  success: false
  error?: string
  message?: string
}

type ApiResponse<T> = ApiSuccess<T> | ApiFailure

type RequestResult<T> = {
  data: T
  message?: string
  path?: string
}

export type XAuthIntent = 'signup' | 'login'

export type XAuthStartData = {
  authorize_url: string
  redirect_uri?: string
  state?: string
  min_followers?: number
}

export type XAuthCompleteData = {
  connection_token?: string
  access_token?: string
  token?: string
  x_handle?: string
  username?: string
  display_name?: string
  avatar_url?: string
  followers?: number
  is_new_user?: boolean
  ambassador?: AmbassadorProfile
  user?: AmbassadorProfile
}

export type AmbassadorProfile = {
  email?: string
  x_handle?: string
  username?: string
  display_name?: string
  avatar_url?: string
}

export type AmbassadorSignupData = {
  token?: string
  access_token?: string
  message?: string
  path?: string
  redirect?: string
  next?: string
  ambassador?: AmbassadorProfile
  user?: AmbassadorProfile
}

export type AmbassadorSignupResult = {
  data: AmbassadorSignupData
  message: string
  path: string
}

export type AmbassadorSignupInput = {
  connection_token: string
  x_handle?: string
  email?: string
  password?: string
}

export type AmbassadorLoginInput = {
  connection_token?: string
  x_handle?: string
  email?: string
  password?: string
}

const SIGNUP_DRAFT_KEY = 'senseifi.ambassador.signupDraft'
const CONNECTION_KEY = 'senseifi.ambassador.xConnection'
const SESSION_KEY = 'senseifi.ambassador.session'
const SIGNUP_ERROR_KEY = 'senseifi.ambassador.signupError'
const OAUTH_INTENT_KEY = 'senseifi.ambassador.oauthIntent'

export type SignupDraft = {
  email: string
  xHandle: string
  password: string
}

export type StoredXConnection = {
  connectionToken: string
  xHandle?: string
  username?: string
  displayName?: string
  avatarUrl?: string
}

export type StoredAmbassadorSession = {
  email?: string
  username?: string
  displayName?: string
  avatarUrl?: string
  token?: string
}

function resolvePath(...candidates: Array<string | undefined>) {
  for (const candidate of candidates) {
    if (!candidate) continue
    const trimmed = candidate.trim()
    if (!trimmed) continue
    if (/^https?:\/\//i.test(trimmed)) {
      try {
        return new URL(trimmed).pathname || '/'
      } catch {
        continue
      }
    }
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  }
  return ''
}

function readErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback

  const record = payload as Record<string, unknown>
  const nested =
    record.data && typeof record.data === 'object'
      ? (record.data as Record<string, unknown>)
      : null

  const candidates = [
    record.error,
    record.message,
    record.detail,
    nested?.error,
    nested?.message,
    nested?.detail,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return fallback
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null
}

function pickString(
  record: Record<string, unknown> | null,
  ...keys: string[]
): string | undefined {
  if (!record) return undefined
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<RequestResult<T>> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), apiConfig.timeoutMs)

  try {
    const response = await fetch(`${apiConfig.baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })

    const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null

    if (!response.ok || !payload || payload.success === false) {
      throw new Error(
        readErrorMessage(payload, `Request failed (${response.status})`),
      )
    }

    const rawData = payload.data
    const data = (
      rawData && typeof rawData === 'object' ? rawData : (payload as unknown)
    ) as T
    const nested = asRecord(data)

    return {
      data,
      message:
        payload.message ||
        pickString(nested, 'message') ||
        pickString(asRecord(payload), 'message'),
      path: resolvePath(
        payload.path,
        payload.redirect,
        payload.next,
        pickString(nested, 'path', 'redirect', 'next'),
      ),
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('The request timed out. Try connecting again.')
    }
    if (err instanceof TypeError) {
      throw new Error('Network error. Check your connection and try again.')
    }
    throw err
  } finally {
    window.clearTimeout(timeout)
  }
}

export function saveSignupDraft(draft: SignupDraft) {
  sessionStorage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(draft))
}

export function readSignupDraft(): SignupDraft | null {
  const raw = sessionStorage.getItem(SIGNUP_DRAFT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SignupDraft
  } catch {
    return null
  }
}

export function clearSignupDraft() {
  sessionStorage.removeItem(SIGNUP_DRAFT_KEY)
}

export function saveXConnection(connection: StoredXConnection) {
  sessionStorage.setItem(CONNECTION_KEY, JSON.stringify(connection))
}

export function readXConnection(): StoredXConnection | null {
  const raw = sessionStorage.getItem(CONNECTION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredXConnection
  } catch {
    return null
  }
}

export function clearXConnection() {
  sessionStorage.removeItem(CONNECTION_KEY)
}

export function saveAmbassadorSession(session: StoredAmbassadorSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function readAmbassadorSession(): StoredAmbassadorSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredAmbassadorSession
  } catch {
    return null
  }
}

export function clearAmbassadorSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

export function saveSignupError(message: string) {
  sessionStorage.setItem(SIGNUP_ERROR_KEY, message)
}

export function consumeSignupError() {
  const message = sessionStorage.getItem(SIGNUP_ERROR_KEY)
  sessionStorage.removeItem(SIGNUP_ERROR_KEY)
  return message
}

export function saveOAuthIntent(intent: XAuthIntent) {
  sessionStorage.setItem(OAUTH_INTENT_KEY, intent)
}

export function readOAuthIntent(): XAuthIntent {
  const value = sessionStorage.getItem(OAUTH_INTENT_KEY)
  return value === 'login' ? 'login' : 'signup'
}

export function clearOAuthIntent() {
  sessionStorage.removeItem(OAUTH_INTENT_KEY)
}

export function enterDashboardAfterSignup() {
  window.location.replace(`${window.location.origin}/overview?welcome=1`)
}

export function enterDashboardAfterLogin() {
  window.location.replace(`${window.location.origin}/overview?welcome=1`)
}

export function normalizeXHandle(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.startsWith('@') ? trimmed : `@${trimmed.replace(/^@+/, '')}`
}

export function draftIsReadyForSignup(draft: SignupDraft | null) {
  if (!draft) return false
  return Boolean(
    draft.email.trim() &&
      normalizeXHandle(draft.xHandle) &&
      draft.password.length >= 8,
  )
}

function profileFromAuthData(data: {
  ambassador?: AmbassadorProfile
  user?: AmbassadorProfile
  username?: string
  x_handle?: string
  display_name?: string
  avatar_url?: string
}) {
  const username = (
    data.ambassador?.username ||
    data.user?.username ||
    data.ambassador?.x_handle ||
    data.user?.x_handle ||
    data.username ||
    data.x_handle ||
    ''
  ).replace(/^@/, '')

  return {
    username: username || undefined,
    displayName:
      data.ambassador?.display_name ||
      data.user?.display_name ||
      data.display_name,
    avatarUrl:
      data.ambassador?.avatar_url || data.user?.avatar_url || data.avatar_url,
    email: data.ambassador?.email || data.user?.email,
  }
}

function persistSessionAndEnter(input: {
  token?: string
  email?: string
  username?: string
  displayName?: string
  avatarUrl?: string
}) {
  saveAmbassadorSession({
    email: input.email,
    username: input.username,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    token: input.token,
  })
  clearSignupDraft()
  clearXConnection()
  clearOAuthIntent()
  enterDashboardAfterSignup()
}

export async function startXAuth(intent: XAuthIntent = 'signup') {
  saveOAuthIntent(intent)
  const result = await request<XAuthStartData>('/api/ambassador/auth/x/start', {
    method: 'POST',
    body: JSON.stringify({ intent }),
  })
  if (!result.data.authorize_url) {
    throw new Error('X authorize URL was missing from the server response.')
  }
  return result.data
}

const completeXAuthInflight = new Map<string, Promise<XAuthCompleteData>>()

function extractSessionToken(
  ...sources: Array<Record<string, unknown> | null | undefined>
) {
  for (const source of sources) {
    if (!source) continue
    const session = asRecord(source.session)
    const auth = asRecord(source.auth)
    const token =
      pickString(
        source,
        'session_token',
        'sessionToken',
        'access_token',
        'accessToken',
        'auth_token',
        'authToken',
        'jwt',
      ) ||
      pickString(session, 'token', 'access_token', 'session_token') ||
      pickString(auth, 'token', 'access_token', 'session_token')
    if (token) return token
  }
  return undefined
}

function normalizeCompleteData(data: unknown): XAuthCompleteData {
  const record = asRecord(data) ?? {}
  const nested = asRecord(record.data) ?? asRecord(record.connection)
  const ambassador =
    (asRecord(record.ambassador) as AmbassadorProfile | null) ||
    (asRecord(nested?.ambassador) as AmbassadorProfile | null) ||
    undefined
  const user =
    (asRecord(record.user) as AmbassadorProfile | null) ||
    (asRecord(nested?.user) as AmbassadorProfile | null) ||
    undefined

  const connectionToken =
    pickString(record, 'connection_token', 'connectionToken') ||
    pickString(nested, 'connection_token', 'connectionToken')

  // Never treat connection_token as the bearer session token.
  const accessToken = extractSessionToken(record, nested, asRecord(record.user), asRecord(record.ambassador))

  if (!connectionToken && !accessToken) {
    throw new Error(
      'X connected, but no session or connection token was returned. Try again.',
    )
  }

  const username =
    pickString(record, 'username') ||
    pickString(nested, 'username') ||
    ambassador?.username ||
    user?.username
  const xHandle =
    pickString(record, 'x_handle', 'xHandle', 'handle') ||
    pickString(nested, 'x_handle', 'xHandle', 'handle') ||
    ambassador?.x_handle ||
    user?.x_handle ||
    (username ? normalizeXHandle(username) : undefined)

  return {
    connection_token: connectionToken,
    access_token: accessToken,
    token: accessToken,
    x_handle: xHandle,
    username,
    display_name:
      pickString(record, 'display_name', 'displayName', 'name') ||
      pickString(nested, 'display_name', 'displayName', 'name') ||
      ambassador?.display_name ||
      user?.display_name,
    avatar_url:
      pickString(record, 'avatar_url', 'avatarUrl', 'profile_image_url') ||
      pickString(nested, 'avatar_url', 'avatarUrl', 'profile_image_url') ||
      ambassador?.avatar_url ||
      user?.avatar_url,
    followers:
      typeof record.followers === 'number'
        ? record.followers
        : typeof nested?.followers === 'number'
          ? nested.followers
          : undefined,
    is_new_user:
      typeof record.is_new_user === 'boolean'
        ? record.is_new_user
        : typeof nested?.is_new_user === 'boolean'
          ? nested.is_new_user
          : undefined,
    ambassador: ambassador || undefined,
    user: user || undefined,
  }
}

export async function completeXAuth(code: string, state: string) {
  const key = `${state}:${code}`
  const existing = completeXAuthInflight.get(key)
  if (existing) return existing

  const promise = (async () => {
    const intent = readOAuthIntent()
    const result = await request<unknown>('/api/ambassador/auth/x/complete', {
      method: 'POST',
      body: JSON.stringify({ code, state, intent }),
    })
    return normalizeCompleteData(result.data)
  })()

  completeXAuthInflight.set(key, promise)

  try {
    return await promise
  } catch (err) {
    completeXAuthInflight.delete(key)
    throw err
  }
}

function attachSessionToken(data: AmbassadorSignupData): AmbassadorSignupData {
  const record = asRecord(data) ?? {}
  const sessionToken =
    extractSessionToken(record, asRecord(record.ambassador), asRecord(record.user)) ||
    pickString(record, 'token')
  if (!sessionToken) return data
  return {
    ...data,
    token: sessionToken,
    access_token: data.access_token || sessionToken,
  }
}

export async function signupAmbassador(
  input: AmbassadorSignupInput,
): Promise<AmbassadorSignupResult> {
  const body: Record<string, string> = {
    connection_token: input.connection_token,
  }
  if (input.x_handle) body.x_handle = normalizeXHandle(input.x_handle)
  if (input.email?.trim()) body.email = input.email.trim()
  if (input.password) body.password = input.password

  const result = await request<AmbassadorSignupData>(
    '/api/ambassador/auth/signup',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )

  const dataRecord = asRecord(result.data)
  const data = attachSessionToken(
    (dataRecord ? result.data : {}) as AmbassadorSignupData,
  )
  return {
    data,
    message:
      result.message ||
      pickString(dataRecord, 'message') ||
      'Account created. Welcome aboard.',
    path: '/overview',
  }
}

export async function loginAmbassador(
  input: AmbassadorLoginInput,
): Promise<AmbassadorSignupResult> {
  const body: Record<string, string> = {}
  if (input.connection_token) body.connection_token = input.connection_token
  if (input.x_handle) body.x_handle = normalizeXHandle(input.x_handle)
  if (input.email?.trim()) body.email = input.email.trim()
  if (input.password) body.password = input.password

  const result = await request<AmbassadorSignupData>(
    '/api/ambassador/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )

  const dataRecord = asRecord(result.data)
  const data = attachSessionToken(
    (dataRecord ? result.data : {}) as AmbassadorSignupData,
  )
  return {
    data,
    message:
      result.message ||
      pickString(dataRecord, 'message') ||
      'Signed in successfully.',
    path: '/overview',
  }
}

/** Exchange an X connection_token for a real bearer session. */
export async function exchangeXConnectionForSession(input: {
  connectionToken: string
  xHandle?: string
  intent?: XAuthIntent
}) {
  const intent = input.intent ?? readOAuthIntent()
  const payload = {
    connection_token: input.connectionToken,
    x_handle: input.xHandle,
  }

  if (intent === 'login') {
    try {
      return await loginAmbassador(payload)
    } catch (err) {
      // Backend X-login may still expect email; signup upserts/signs in with X.
      const message = err instanceof Error ? err.message : ''
      if (!/email/i.test(message)) throw err
    }
  }

  return signupAmbassador(payload)
}

export async function finishSignupAndEnterDashboard(input: {
  connectionToken: string
  xHandle?: string
  email?: string
  password?: string
  profile?: {
    username?: string
    displayName?: string
    avatarUrl?: string
  }
}) {
  const result = await signupAmbassador({
    connection_token: input.connectionToken,
    x_handle: input.xHandle,
    email: input.email,
    password: input.password,
  })

  const profile = profileFromAuthData({
    ...result.data,
    username: input.profile?.username,
    display_name: input.profile?.displayName,
    avatar_url: input.profile?.avatarUrl,
    x_handle: input.xHandle,
  })

  const sessionToken = result.data.token || result.data.access_token
  if (!sessionToken) {
    throw new Error(
      'Account created, but no session token was returned. Try signing in again.',
    )
  }

  persistSessionAndEnter({
    token: sessionToken,
    email: input.email?.trim() || profile.email,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
  })
  return result
}

/**
 * After X OAuth completes:
 * 1) use a real session token if complete returned one
 * 2) otherwise exchange connection_token via X signup/login (no email)
 * Never send connection_token as the overview Bearer token.
 */
export async function finishXAuthAndEnterDashboard(
  complete: XAuthCompleteData,
  intent: XAuthIntent = readOAuthIntent(),
) {
  const profile = profileFromAuthData(complete)
  let sessionToken = complete.access_token || complete.token

  if (complete.connection_token) {
    saveXConnection({
      connectionToken: complete.connection_token,
      xHandle: complete.x_handle,
      username: complete.username,
      displayName: complete.display_name,
      avatarUrl: complete.avatar_url,
    })
  }

  if (!sessionToken) {
    if (!complete.connection_token) {
      throw new Error(
        'X connected, but no session was returned. Try connecting again.',
      )
    }

    const exchanged = await exchangeXConnectionForSession({
      connectionToken: complete.connection_token,
      xHandle:
        complete.x_handle ||
        (complete.username ? normalizeXHandle(complete.username) : undefined),
      intent,
    })
    sessionToken = exchanged.data.token || exchanged.data.access_token
    const exchangedProfile = profileFromAuthData({
      ...exchanged.data,
      username: profile.username,
      display_name: profile.displayName,
      avatar_url: profile.avatarUrl,
      x_handle: complete.x_handle,
    })

    if (!sessionToken) {
      throw new Error(
        'X connected, but no session token was returned. Try again.',
      )
    }

    persistSessionAndEnter({
      token: sessionToken,
      email: exchangedProfile.email || profile.email,
      username: exchangedProfile.username || profile.username,
      displayName: exchangedProfile.displayName || profile.displayName,
      avatarUrl: exchangedProfile.avatarUrl || profile.avatarUrl,
    })
    return
  }

  persistSessionAndEnter({
    token: sessionToken,
    email: profile.email,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
  })
}

/** Exchange a saved X connection for a bearer session, then open the dashboard. */
export async function enterDashboardFromXConnection() {
  const connection = readXConnection()
  if (!connection?.connectionToken) {
    throw new Error('Connect with X first.')
  }

  const exchanged = await exchangeXConnectionForSession({
    connectionToken: connection.connectionToken,
    xHandle: connection.xHandle,
    intent: readOAuthIntent(),
  })
  const sessionToken = exchanged.data.token || exchanged.data.access_token
  if (!sessionToken) {
    throw new Error(
      'X connected, but no session token was returned. Try again.',
    )
  }

  const profile = profileFromAuthData({
    ...exchanged.data,
    username: connection.username,
    display_name: connection.displayName,
    avatar_url: connection.avatarUrl,
    x_handle: connection.xHandle,
  })

  persistSessionAndEnter({
    token: sessionToken,
    email: profile.email,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
  })
}
