export type RewardFilter = 'all' | 'pending' | 'approved'

export type RewardStatus = 'pending' | 'approved'

export type RewardEntry = {
  id: string
  date: string
  event: string
  user: string
  amount: string
  status: RewardStatus
  note: string
}

export type RewardRule = {
  title: string
  value: string
  detail: string
}

export const rewards = {
  title: 'Reward Ledger',
  subtitle: 'Every commission, its status, and when held rewards release.',
  ambassador: {
    level: 'Level 1',
  },
  filters: [
    { id: 'all' as const, label: 'All' },
    { id: 'pending' as const, label: 'Pending' },
    { id: 'approved' as const, label: 'Approved' },
  ],
  rules: [
    {
      title: 'Verified registration',
      value: '$0.20',
      detail:
        'A genuine new account completes signup verification. One reward per unique person.',
    },
    {
      title: 'Wallet activation',
      value: '$0.60',
      detail:
        'Wallet connected and first eligible security scan completed. Wallet alone does not qualify.',
    },
    {
      title: 'First paid subscription',
      value: '$5.00',
      detail:
        'First settled payment only. No trials, declined charges, refunds or chargebacks. 30-day review hold.',
    },
    {
      title: 'Renewals',
      value: '10%',
      detail:
        'Of collected renewal revenue, first 3 renewals, capped at $5 additional per customer.',
    },
  ] satisfies RewardRule[],
  example:
    'Example: $0.20 signup + $0.60 activation = $0.80. Adding the $5.00 first subscription = $5.80 before renewals.',
}
