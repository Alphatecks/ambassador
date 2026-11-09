import { apiConfig } from '../config/api.ts'
import { readAmbassadorSession } from './ambassadorAuth.ts'

type ApiSuccess<T> = {
  success?: boolean
  data?: T
  message?: string
  error?: string
}

type ApiFailure = {
  success: false
  error?: string
  message?: string
}

type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export type ApiResult<T> = {
  data: T
  message?: string
}

function readErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback
  const record = payload as Record<string, unknown>
  const nested =
    record.data && typeof record.data === 'object'
      ? (record.data as Record<string, unknown>)
      : null
  for (const candidate of [
    record.error,
    record.message,
    nested?.error,
    nested?.message,
  ]) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }
  return fallback
}

export function getSessionToken() {
  return readAmbassadorSession()?.token || null
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<ApiResult<T>> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), apiConfig.timeoutMs)
  const headers = new Headers(init?.headers)
  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (init?.auth !== false) {
    const token = getSessionToken()
    if (!token) throw new Error('Missing bearer token. Sign in again.')
    headers.set('Authorization', `Bearer ${token}`)
  }

  try {
    const response = await fetch(`${apiConfig.baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers,
    })
    const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null

    if (!response.ok || !payload || payload.success === false) {
      throw new Error(
        readErrorMessage(payload, `Request failed (${response.status})`),
      )
    }

    const data = (
      payload.data && typeof payload.data === 'object'
        ? payload.data
        : (payload as unknown)
    ) as T

    return {
      data,
      message:
        typeof payload.message === 'string' ? payload.message : undefined,
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('The request timed out. Try again.')
    }
    if (err instanceof TypeError) {
      throw new Error('Network error. Check your connection and try again.')
    }
    throw err
  } finally {
    window.clearTimeout(timeout)
  }
}
