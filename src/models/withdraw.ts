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

export const withdrawEntries: WithdrawEntry[] = [
  {
    id: 'wd-1',
    date: 'Today',
    amount: '$120.00',
    destination: '0xA1b2…5678',
    status: 'pending',
    note: 'Processing · ETA under 24h',
  },
  {
    id: 'wd-2',
    date: '4 Nov',
    amount: '$85.50',
    destination: '0xA1b2…5678',
    status: 'sent',
    note: 'Tx confirmed',
  },
  {
    id: 'wd-3',
    date: '28 Oct',
    amount: '$40.00',
    destination: '0xA1b2…5678',
    status: 'sent',
    note: 'Tx confirmed',
  },
  {
    id: 'wd-4',
    date: '12 Oct',
    amount: '$25.00',
    destination: '0xA1b2…5678',
    status: 'failed',
    note: 'Returned · wallet rejected',
  },
]

export const withdraw = {
  title: 'Withdraw',
  subtitle: 'Move available earnings to your connected wallet.',
  available: 298.5,
  pending: 120,
  withdrawn: 125.5,
  minAmount: 20,
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
  ],
  example:
    'Example: available $298.50. Request $100 to your connected wallet. The rest stays ready for the next payout.',
}
