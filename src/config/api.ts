import { env } from './env'

export const apiConfig = {
  baseUrl: env.apiUrl,
  timeoutMs: 15_000,
} as const
