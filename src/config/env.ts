import { project } from './project'

const defaultApiUrl = 'https://senseifi-backend.onrender.com'
const defaultOAuthHandoffOrigin = 'https://amb.senseifi.io'

export const env = {
  apiUrl: (import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/$/, ''),
  appName: import.meta.env.VITE_APP_NAME || project.name,
  /** Production origin that X is allowed to redirect to. */
  oauthHandoffOrigin: (
    import.meta.env.VITE_OAUTH_HANDOFF_ORIGIN || defaultOAuthHandoffOrigin
  ).replace(/\/$/, ''),
} as const
