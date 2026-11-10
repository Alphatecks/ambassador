export type WithdrawFilter = 'all' | 'pending' | 'sent' | 'failed'

export type WithdrawStatus = 'pending' | 'sent' | 'failed'

export type WithdrawEntry = {
  id: string
  date: string
  amount: string
  destination: string
  status: WithdrawStatus
  note: string
}

export type WithdrawRule = {
  title: string
  value: string
  detail: string
}

export const withdraw = {
  title: 'Withdraw',
  subtitle: 'Move available earnings to your connected wallet.',
  filters: [
    { id: 'all' as const, label: 'All' },
    { id: 'pending' as const, label: 'Pending' },
    { id: 'sent' as const, label: 'Sent' },
    { id: 'failed' as const, label: 'Failed' },
  ],
  rules: [
    {
      title: 'Available balance',
      value: 'Ready',
      detail: 'Only approved referral earnings can be withdrawn.',
    },
    {
      title: 'Connected wallet',
      value: 'Required',
      detail: 'Withdrawals send to the wallet connected in your dashboard.',
    },
    {
      title: 'Minimum payout',
      value: '$20',
      detail: 'Requests below the minimum stay in available balance.',
    },
    {
      title: 'Processing',
      value: 'Up to 24h',
      detail: 'Pending withdrawals settle once the transfer is confirmed.',
    },
  ] satisfies WithdrawRule[],
  example:
    'Example: available $298.50. Request $100 to your connected wallet. The rest stays ready for the next payout.',
}
