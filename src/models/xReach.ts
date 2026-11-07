export type XPostFilter = 'all' | 'tracked' | 'pending'

export type XPostStatus = 'tracked' | 'pending'

export type XPost = {
  id: string
  date: string
  preview: string
  url: string
  impressions: number
  likes: number
  reposts: number
  replies: number
  status: XPostStatus
  note: string
}

export const xPosts: XPost[] = [
  {
    id: 'post-1',
    date: 'Today',
    preview: 'Protect your crypto with SenseiFi. Scan threats before they hit your wallet.',
    url: 'https://x.com/kaioka/status/1',
    impressions: 18420,
    likes: 312,
    reposts: 64,
    replies: 28,
    status: 'tracked',
    note: 'Matched today’s marketing pack',
  },
  {
    id: 'post-2',
    date: 'Yesterday',
    preview: 'New SenseiFi ambassador drop. Follow the link in my bio to get started.',
    url: 'https://x.com/kaioka/status/2',
    impressions: 12680,
    likes: 241,
    reposts: 39,
    replies: 17,
    status: 'tracked',
    note: 'Story caption reshare',
  },
  {
    id: 'post-3',
    date: '5 Nov',
    preview: 'SenseiFi Ambassadors earn when people activate wallets and subscribe.',
    url: 'https://x.com/kaioka/status/3',
    impressions: 9340,
    likes: 188,
    reposts: 27,
    replies: 11,
    status: 'tracked',
    note: 'Organic mention',
  },
  {
    id: 'post-4',
    date: '4 Nov',
    preview: 'Security should come before the first transfer. SenseiFi helps users verify risk early.',
    url: 'https://x.com/kaioka/status/4',
    impressions: 0,
    likes: 0,
    reposts: 0,
    replies: 0,
    status: 'pending',
    note: 'Waiting for X metrics sync',
  },
  {
    id: 'post-5',
    date: '3 Nov',
    preview: 'One referral link. One account. Share SenseiFi and earn on verified activations.',
    url: 'https://x.com/kaioka/status/5',
    impressions: 7120,
    likes: 154,
    reposts: 21,
    replies: 9,
    status: 'tracked',
    note: 'Referral reminder graphic',
  },
]

export const xReach = {
  title: 'X Reach',
  subtitle: 'Tracked posts from your connected X account, with impressions and engagement.',
  filters: [
    { id: 'all' as const, label: 'All' },
    { id: 'tracked' as const, label: 'Tracked' },
    { id: 'pending' as const, label: 'Pending' },
  ],
  stats: [
    {
      id: 'posts',
      label: 'Tracked posts',
      value: '4',
      detail: '1 still syncing',
    },
    {
      id: 'impressions',
      label: 'Impressions',
      value: '47.6K',
      detail: 'Last 7 days',
    },
    {
      id: 'engagement',
      label: 'Engagement',
      value: '1.1K',
      detail: 'Likes, reposts, replies',
    },
  ],
  rules: [
    {
      title: 'Connected account',
      value: 'Required',
      detail: 'Only posts from your connected X account are tracked.',
    },
    {
      title: 'Impressions',
      value: 'X metrics',
      detail: 'Impression counts sync from X after the post is detected.',
    },
    {
      title: 'Campaign match',
      value: 'Optional',
      detail: 'Posts that reuse daily marketing creatives are tagged automatically.',
    },
    {
      title: 'Pending sync',
      value: 'Up to 24h',
      detail: 'New posts can sit in pending until impressions are available.',
    },
  ],
  example:
    'Example: reshare today’s pack on X. Once tracked, impressions and engagement appear in this ledger.',
}

export function formatCount(value: number) {
  if (value >= 1000) {
    const compact = value / 1000
    const digits = compact >= 10 ? 1 : 2
    return `${compact.toFixed(digits).replace(/\.?0+$/, '')}K`
  }
  return value.toLocaleString('en-US')
}
