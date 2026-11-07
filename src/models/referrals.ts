export type ReferralFilter = 'all' | 'activated' | 'paid'

export type ReferralUser = {
  id: string
  label: string
  walletConnected: boolean
  subscription: 'Free' | 'Paid'
  joined: string
  status: string
}

const pageSize = 11
const pageCount = 4

export const referralUsers: ReferralUser[] = Array.from(
  { length: pageSize * pageCount },
  (_, index) => ({
    id: `user-${index + 1}`,
    label: 'usr_••41',
    walletConnected: true,
    subscription: 'Free',
    joined: '2nd Oct',
    status: '2nd Oct',
  }),
)

export const referrals = {
  title: 'Referrals',
  subtitle: 'Every referred user and each event they have triggered.',
  ambassador: {
    level: 'Level 1',
  },
  referralNote:
    'Attribution happens at verified signup. One account belongs to one ambassador; self-referrals, duplicates and bot signups are blocked.',
  funnel: [
    { label: 'Registered', value: '360', detail: 'verified' },
    { label: 'Activated', value: '220', detail: '61% of registered' },
    { label: 'Paid', value: '60', detail: '27% of activated' },
  ],
  filters: [
    { id: 'all' as const, label: 'All' },
    { id: 'activated' as const, label: 'Activated' },
    { id: 'paid' as const, label: 'Paid' },
  ],
  pageSize,
  pageCount,
  timeline: [
    {
      title: 'Verified registration',
      detail: 'Today, +$0.20',
    },
    {
      title: 'Wallet connected',
      detail: 'Connected',
    },
    {
      title: 'First eligible security scan',
      detail: 'Completed. Activation +$0.60',
    },
    {
      title: 'First paid subscription',
      detail: 'Settled. In 30-day review, releases 16 Nov. +$5.00',
    },
  ],
  timelineNote: 'Subscription rewards are held for a 30-day review.',
}
