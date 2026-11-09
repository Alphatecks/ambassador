export {
  clearAmbassadorSession,
  clearSignupDraft,
  clearXConnection,
  completeXAuth,
  consumeSignupError,
  draftIsReadyForSignup,
  enterDashboardAfterLogin,
  enterDashboardAfterSignup,
  enterDashboardFromXConnection,
  exchangeXConnectionForSession,
  finishSignupAndEnterDashboard,
  finishXAuthAndEnterDashboard,
  loginAmbassador,
  normalizeXHandle,
  readAmbassadorSession,
  readOAuthIntent,
  readSignupDraft,
  readXConnection,
  saveAmbassadorSession,
  saveOAuthIntent,
  saveSignupDraft,
  saveSignupError,
  saveXConnection,
  signupAmbassador,
  startXAuth,
  type AmbassadorSignupResult,
  type XAuthIntent,
} from './ambassadorAuth.ts'

export {
  bounceOAuthCallbackToLocalDev,
  getOAuthHandoffUrl,
  needsOAuthHandoff,
} from './oauthDevHandoff.ts'

export { getSessionToken, apiRequest, apiDownload } from './apiClient.ts'
export {
  emptyOverview,
  extractReferralFromOverview,
  fetchAmbassadorOverview,
  fetchAmbassadorReferralLink,
  normalizeOverview,
  type OverviewViewModel,
} from './ambassadorOverview.ts'
export {
  downloadMarketingAsset,
  fetchAmbassadorMarketing,
  fetchMarketingAssetPreview,
  marketingAssetFileUrl,
  normalizeMarketing,
  type MarketingPageData,
} from './ambassadorMarketing.ts'
