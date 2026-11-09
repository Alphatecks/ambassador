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

export type XAuthStartData = {
  authorize_url: string
  redirect_uri?: string
  state?: string
  min_followers?: number
}

export type XAuthCompleteData = {
  connection_token: string
  x_handle?: string
  username?: string
  display_name?: string
  avatar_url?: string
  followers?: number
}

export type AmbassadorSignupData = {
  token?: string
  access_token?: string
  message?: string
  path?: string
  redirect?: string
  next?: string
  ambassador?: {
    email?: string
    x_handle?: string
    username?: string
    display_name?: string
    avatar_url?: string
  }
  user?: {
    email?: string
    x_handle?: string
    username?: string
  }
}

export type AmbassadorSignupResult = {
  data: AmbassadorSignupData
  message: string
  path: string
}

export type AmbassadorSignupInput = {
  email: string
  password: string
  x_handle: string
  connection_token: string
}

const SIGNUP_DRAFT_KEY = 'senseifi.ambassador.signupDraft'
const CONNECTION_KEY = 'senseifi.ambassador.xConnection'
const SESSION_KEY = 'senseifi.ambassador.session'
const SIGNUP_ERROR_KEY = 'senseifi.ambassador.signupError'

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

export function enterDashboardAfterSignup() {
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

export async function startXAuth() {
  const result = await request<XAuthStartData>('/api/ambassador/auth/x/start', {
    method: 'POST',
    body: '{}',
  })
  if (!result.data.authorize_url) {
    throw new Error('X authorize URL was missing from the server response.')
  }
  return result.data
}

const completeXAuthInflight = new Map<string, Promise<XAuthCompleteData>>()

function normalizeCompleteData(data: unknown): XAuthCompleteData {
  const record = asRecord(data) ?? {}
  const nested = asRecord(record.data) ?? asRecord(record.connection)
  const connectionToken =
    pickString(record, 'connection_token', 'connectionToken', 'token') ||
    pickString(nested, 'connection_token', 'connectionToken', 'token')

  if (!connectionToken) {
    throw new Error(
      'X connected, but no connection token was returned. Try again.',
    )
  }

  const username =
    pickString(record, 'username') || pickString(nested, 'username')
  const xHandle =
    pickString(record, 'x_handle', 'xHandle', 'handle') ||
    pickString(nested, 'x_handle', 'xHandle', 'handle') ||
    (username ? normalizeXHandle(username) : undefined)

  return {
    connection_token: connectionToken,
    x_handle: xHandle,
    username,
    display_name:
      pickString(record, 'display_name', 'displayName', 'name') ||
      pickString(nested, 'display_name', 'displayName', 'name'),
    avatar_url:
      pickString(record, 'avatar_url', 'avatarUrl', 'profile_image_url') ||
      pickString(nested, 'avatar_url', 'avatarUrl', 'profile_image_url'),
    followers:
      typeof record.followers === 'number'
        ? record.followers
        : typeof nested?.followers === 'number'
          ? nested.followers
          : undefined,
  }
}

export async function completeXAuth(code: string, state: string) {
  const key = `${state}:${code}`
  const existing = completeXAuthInflight.get(key)
  if (existing) return existing

  const promise = (async () => {
    const result = await request<unknown>('/api/ambassador/auth/x/complete', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
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

export async function signupAmbassador(
  input: AmbassadorSignupInput,
): Promise<AmbassadorSignupResult> {
  const result = await request<AmbassadorSignupData>(
    '/api/ambassador/auth/signup',
    {
      method: 'POST',
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        x_handle: normalizeXHandle(input.x_handle),
        connection_token: input.connection_token,
      }),
    },
  )

  const dataRecord = asRecord(result.data)
  return {
    data: (dataRecord ? result.data : {}) as AmbassadorSignupData,
    message:
      result.message ||
      pickString(dataRecord, 'message') ||
      'Account created. Welcome aboard.',
    path: '/overview',
  }
}

export async function finishSignupAndEnterDashboard(input: {
  email: string
  password: string
  xHandle: string
  connectionToken: string
  profile?: {
    username?: string
    displayName?: string
    avatarUrl?: string
  }
}) {
  const handle = normalizeXHandle(input.xHandle)
  const result = await signupAmbassador({
    email: input.email.trim(),
    password: input.password,
    x_handle: handle,
    connection_token: input.connectionToken,
  })

  const username = (
    result.data.ambassador?.username ||
    result.data.user?.username ||
    result.data.ambassador?.x_handle ||
    result.data.user?.x_handle ||
    input.profile?.username ||
    handle
  ).replace(/^@/, '')

  saveAmbassadorSession({
    email: input.email.trim(),
    username,
    displayName:
      result.data.ambassador?.display_name || input.profile?.displayName,
    avatarUrl: result.data.ambassador?.avatar_url || input.profile?.avatarUrl,
    token: result.data.token || result.data.access_token,
  })
  clearSignupDraft()
  clearXConnection()
  enterDashboardAfterSignup()
  return result
}
