import { project } from './project'

const defaultApiUrl = 'https://senseifi-backend.onrender.com'

export const env = {
  apiUrl: (import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/$/, ''),
  appName: import.meta.env.VITE_APP_NAME || project.name,
} as const
