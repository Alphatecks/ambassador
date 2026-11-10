import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LazyPlaceholder } from './views/components/LazyPlaceholder.tsx'
import { DashboardShell } from './views/layouts/DashboardShell.tsx'
import { LandingPage } from './views/pages/LandingPage.tsx'
import { LoginPage } from './views/pages/LoginPage.tsx'
import { OAuthCallbackPage } from './views/pages/OAuthCallbackPage.tsx'
import { OAuthDevHandoffPage } from './views/pages/OAuthDevHandoffPage.tsx'
import { SignupPage } from './views/pages/SignupPage.tsx'

const OverviewPage = lazy(() =>
  import('./views/pages/OverviewPage.tsx').then(module => ({
    default: module.OverviewPage,
  })),
)
const ReferralsPage = lazy(() =>
  import('./views/pages/ReferralsPage.tsx').then(module => ({
    default: module.ReferralsPage,
  })),
)
const MarketingPage = lazy(() =>
  import('./views/pages/MarketingPage.tsx').then(module => ({
    default: module.MarketingPage,
  })),
)
const XReachPage = lazy(() =>
  import('./views/pages/XReachPage.tsx').then(module => ({
    default: module.XReachPage,
  })),
)
const RewardsPage = lazy(() =>
  import('./views/pages/RewardsPage.tsx').then(module => ({
    default: module.RewardsPage,
  })),
)
const WithdrawPage = lazy(() =>
  import('./views/pages/WithdrawPage.tsx').then(module => ({
    default: module.WithdrawPage,
  })),
)

function ApiPageFallback() {
  return (
    <div className="dashboard-lazy">
      <LazyPlaceholder variant="page" label="Loading page…" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-up" element={<SignupPage />} />
        <Route path="/sign-in" element={<LoginPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/oauth/dev-handoff" element={<OAuthDevHandoffPage />} />
        <Route element={<DashboardShell />}>
          <Route
            path="/overview"
            element={
              <Suspense fallback={<ApiPageFallback />}>
                <OverviewPage />
              </Suspense>
            }
          />
          <Route
            path="/referrals"
            element={
              <Suspense fallback={<ApiPageFallback />}>
                <ReferralsPage />
              </Suspense>
            }
          />
          <Route
            path="/marketing"
            element={
              <Suspense fallback={<ApiPageFallback />}>
                <MarketingPage />
              </Suspense>
            }
          />
          <Route
            path="/x-reach"
            element={
              <Suspense fallback={<ApiPageFallback />}>
                <XReachPage />
              </Suspense>
            }
          />
          <Route
            path="/rewards"
            element={
              <Suspense fallback={<ApiPageFallback />}>
                <RewardsPage />
              </Suspense>
            }
          />
          <Route
            path="/withdraw"
            element={
              <Suspense fallback={<ApiPageFallback />}>
                <WithdrawPage />
              </Suspense>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
