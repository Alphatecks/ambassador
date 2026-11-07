import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { DashboardShell } from './views/layouts/DashboardShell.tsx'
import { LoginPage } from './views/pages/LoginPage.tsx'
import { MarketingPage } from './views/pages/MarketingPage.tsx'
import { OverviewPage } from './views/pages/OverviewPage.tsx'
import { ReferralsPage } from './views/pages/ReferralsPage.tsx'
import { RewardsPage } from './views/pages/RewardsPage.tsx'
import { SignupPage } from './views/pages/SignupPage.tsx'
import { WithdrawPage } from './views/pages/WithdrawPage.tsx'
import { XReachPage } from './views/pages/XReachPage.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignupPage />} />
        <Route path="/sign-in" element={<LoginPage />} />
        <Route element={<DashboardShell />}>
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/referrals" element={<ReferralsPage />} />
          <Route path="/marketing" element={<MarketingPage />} />
          <Route path="/x-reach" element={<XReachPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/withdraw" element={<WithdrawPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
