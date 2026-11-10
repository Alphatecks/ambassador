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
  engagement?: number
  engagementDetail?: string
  status: XPostStatus
  note: string
}

export type XReachStat = {
  id: string
  label: string
  value: string
  detail: string
}

export type XReachRule = {
  title: string
  value: string
  detail: string
}

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
      value: '0',
      detail: 'From your connected X account',
    },
    {
      id: 'impressions',
      label: 'Impressions',
      value: '0',
      detail: 'Last 7 days',
    },
    {
      id: 'engagement',
      label: 'Engagement',
      value: '0',
      detail: 'Likes, reposts, replies',
    },
    {
      id: 'campaign',
      label: 'Campaign matches',
      value: '0',
      detail: 'Using daily creatives',
    },
  ] satisfies XReachStat[],
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
  ] satisfies XReachRule[],
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
