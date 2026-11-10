export type ReferralFilter = 'all' | 'activated' | 'paid'

export type ReferralUser = {
  id: string
  label: string
  walletConnected: boolean
  subscription: 'Free' | 'Paid'
  joined: string
  status: string
}

export type ReferralFunnelStep = {
  label: string
  value: string
  detail: string
}

export type ReferralTimelineEvent = {
  id: string
  title: string
  detail: string
}

export const referrals = {
  title: 'Referrals',
  subtitle: 'Every referred user and each event they have triggered.',
  ambassador: {
    level: 'Level 1',
  },
  referralNote:
    'Attribution happens at verified signup. One account belongs to one ambassador; self-referrals, duplicates and bot signups are blocked.',
  funnel: [
    { label: 'Registered', value: '0', detail: 'verified' },
    { label: 'Activated', value: '0', detail: 'of registered' },
    { label: 'Paid', value: '0', detail: 'of activated' },
  ] satisfies ReferralFunnelStep[],
  filters: [
    { id: 'all' as const, label: 'All' },
    { id: 'activated' as const, label: 'Activated' },
    { id: 'paid' as const, label: 'Paid' },
  ],
  pageSize: 11,
  timelineNote: 'Subscription rewards are held for a 30-day review.',
}
