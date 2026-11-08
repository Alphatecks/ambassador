import { apiConfig } from '../config/api.ts'

type ApiSuccess<T> = {
  success: true
  data?: T
  message?: string
  path?: string
  redirect?: string
  next?: string
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
      const message =
        (payload && 'error' in payload && payload.error) ||
        (payload && 'message' in payload && payload.message) ||
        `Request failed (${response.status})`
      throw new Error(message)
    }

    const data = (payload.data ?? ({} as T)) as T
    const nested =
      data && typeof data === 'object'
        ? (data as {
            message?: string
            path?: string
            redirect?: string
            next?: string
          })
        : undefined

    return {
      data,
      message: payload.message || nested?.message,
      path: resolvePath(
        payload.path,
        payload.redirect,
        payload.next,
        nested?.path,
        nested?.redirect,
        nested?.next,
      ),
    }
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

export function normalizeXHandle(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.startsWith('@') ? trimmed : `@${trimmed.replace(/^@+/, '')}`
}

export async function startXAuth() {
  const result = await request<XAuthStartData>('/api/ambassador/auth/x/start', {
    method: 'POST',
    body: '{}',
  })
  return result.data
}

export async function completeXAuth(code: string, state: string) {
  const result = await request<XAuthCompleteData>(
    '/api/ambassador/auth/x/complete',
    {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    },
  )
  return result.data
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

  const hasSession = Boolean(result.data.token || result.data.access_token)
  const path =
    result.path ||
    (hasSession ? '/overview' : '/sign-in')

  return {
    data: result.data,
    message:
      result.message ||
      result.data.message ||
      (hasSession
        ? 'Account created. Welcome aboard.'
        : 'Account created. Sign in to continue.'),
    path,
  }
}
