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
export {
  emptyReferralsPage,
  fetchAmbassadorReferrals,
  fetchReferralTimeline,
  normalizeReferrals,
  type FetchReferralsInput,
  type ReferralsPageData,
} from './ambassadorReferrals.ts'
export {
  emptyRewardsPage,
  fetchAmbassadorRewards,
  normalizeRewards,
  type FetchRewardsInput,
  type RewardsPageData,
} from './ambassadorRewards.ts'
export {
  connectAmbassadorWallet,
  emptyWithdrawPage,
  fetchAmbassadorWithdraw,
  normalizeWithdraw,
  requestAmbassadorWithdraw,
  requestBrowserWalletAddress,
  type FetchWithdrawInput,
  type WithdrawPageData,
  type WithdrawWalletInfo,
} from './ambassadorWithdraw.ts'
export {
  emptyXReachPage,
  fetchAmbassadorXReach,
  formatCount,
  normalizeXReach,
  syncAmbassadorXReach,
  type FetchXReachInput,
  type XReachPageData,
} from './ambassadorXReach.ts'
