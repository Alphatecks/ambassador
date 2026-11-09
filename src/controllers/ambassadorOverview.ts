import { apiRequest } from './apiClient.ts'

export type OverviewTarget = {
  label: string
  current: number
  goal: number
  percent: number
  remaining: number
}

export type OverviewViewModel = {
  title: string
  subtitle: string
  ambassador: {
    name: string
    level: string
    rankProgress: number
    nextRank: string
    xpLabel: string
  }
  earnings: {
    total: number
    lines: Array<{ label: string; amount: number }>
  }
  step: {
    current: number
    total: number
    name: string
    tiers: Array<{
      name: string
      amount: string
      active: boolean
      complete: boolean
    }>
    nextUnlock: string
  }
  escrow: {
    amount: number
    status: string
    detail: string
  }
  reward: {
    title: string
    status: string
    note: string
    overallPercent: number
    targets: OverviewTarget[]
  }
  referralLink: string
  referralNote: string
  funnel: Array<{
    index: string
    name: string
    title: string
    value: string
    detail: string
    detailTone: 'muted' | 'link'
  }>
  raw?: unknown
}

const TIER_AMOUNTS = ['$1,000', '$2,000', '$4,000'] as const
const TIER_NAMES = ['Rising', 'Elite', 'Legendary'] as const

const DEFAULT_TARGET_META = [
  {
    key: 'registrations',
    label: 'Verified registrations',
    aliases: [
      'verified_registrations',
      'registrations',
      'signups',
      'verifiedSignups',
      'verified_signups',
    ],
    goal: 500,
  },
  {
    key: 'wallets',
    label: 'Activated wallets',
    aliases: [
      'activated_wallets',
      'wallets',
      'wallet_activations',
      'activatedWallets',
      'wallet_activations_count',
    ],
    goal: 300,
  },
  {
    key: 'subscribers',
    label: 'New paid subscribers',
    aliases: [
      'paid_subscribers',
      'subscribers',
      'subscriptions',
      'new_paid_subscribers',
      'paid_subscriptions',
    ],
    goal: 100,
  },
] as const

export const emptyOverview = (): OverviewViewModel => ({
  title: 'Overview',
  subtitle: 'Your ambassador rank, unlocked rewards, and the mission still ahead.',
  ambassador: {
    name: 'Ambassador',
    level: 'Level 1',
    rankProgress: 0,
    nextRank: 'Elite Ambassador',
    xpLabel: 'Mission progress',
  },
  earnings: {
    total: 0,
    lines: [],
  },
  step: {
    current: 1,
    total: 3,
    name: 'Rising Ambassador',
    tiers: TIER_NAMES.map((name, index) => ({
      name,
      amount: TIER_AMOUNTS[index],
      active: index === 0,
      complete: false,
    })),
    nextUnlock: 'Clear all three Rising targets to unlock the $1,000 escrow reward.',
  },
  escrow: {
    amount: 0,
    status: '—',
    detail: '',
  },
  reward: {
    title: 'Rising mission',
    status: 'In progress',
    note: 'All three targets required. Signups alone will not unlock the reward.',
    overallPercent: 0,
    targets: DEFAULT_TARGET_META.map(meta => ({
      label: meta.label,
      current: 0,
      goal: meta.goal,
      percent: 0,
      remaining: meta.goal,
    })),
  },
  referralLink: '',
  referralNote: 'One account, one ambassador. Self-referrals and duplicates are blocked.',
  funnel: [],
})

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function num(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return fallback
}

function str(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function targetFrom(label: string, currentRaw: unknown, goalRaw: unknown, fallbackGoal: number): OverviewTarget {
  const current = num(currentRaw, 0)
  const goal = Math.max(1, num(goalRaw, fallbackGoal))
  const percent = Math.min(100, Math.round((current / goal) * 100))
  return {
    label,
    current,
    goal,
    percent,
    remaining: Math.max(0, goal - current),
  }
}

function readTargetPair(
  containers: Array<Record<string, unknown> | null>,
  aliases: readonly string[],
): { current: unknown; goal: unknown } | null {
  for (const source of containers) {
    if (!source) continue

    for (const alias of aliases) {
      const nested = asRecord(source[alias])
      if (nested) {
        return {
          current:
            nested.current ??
            nested.count ??
            nested.value ??
            nested.progress ??
            nested.completed,
          goal:
            nested.goal ??
            nested.target ??
            nested.required ??
            nested.limit ??
            nested.total,
        }
      }

      if (alias in source) {
        const direct = source[alias]
        if (typeof direct === 'number' || typeof direct === 'string') {
          return {
            current: direct,
            goal:
              source[`${alias}_goal`] ??
              source[`${alias}Goal`] ??
              source[`${alias}_target`] ??
              source[`${alias}Target`],
          }
        }
      }
    }

    const list = source.targets ?? source.items ?? source.metrics
    if (Array.isArray(list)) {
      for (const item of list) {
        const row = asRecord(item)
        if (!row) continue
        const key = str(row.key ?? row.id ?? row.slug ?? row.code ?? row.type).toLowerCase()
        const label = str(row.label ?? row.name).toLowerCase()
        const matched = aliases.some(alias => {
          const needle = alias.replace(/_/g, ' ').toLowerCase()
          return (
            key === alias.toLowerCase() ||
            key.includes(alias.toLowerCase()) ||
            label.includes(needle) ||
            label.includes(alias.split('_').slice(-1)[0] || '')
          )
        })
        if (!matched) continue
        return {
          current: row.current ?? row.count ?? row.value ?? row.progress,
          goal: row.goal ?? row.target ?? row.required ?? row.limit ?? row.total,
        }
      }
    }
  }

  return null
}

function buildFunnel(targets: OverviewTarget[]) {
  const cleared = targets.filter(target => target.current >= target.goal).length
  return [
    {
      index: '01',
      name: 'Attract',
      title: 'Verified signups',
      value: String(targets[0]?.current ?? 0),
      detail: `of ${targets[0]?.goal ?? 0} needed`,
      detailTone: 'muted' as const,
    },
    {
      index: '02',
      name: 'Activate',
      title: 'Wallets live',
      value: String(targets[1]?.current ?? 0),
      detail: `of ${targets[1]?.goal ?? 0} needed`,
      detailTone: 'muted' as const,
    },
    {
      index: '03',
      name: 'Convert',
      title: 'Paid subs',
      value: String(targets[2]?.current ?? 0),
      detail: `of ${targets[2]?.goal ?? 0} needed`,
      detailTone: 'muted' as const,
    },
    {
      index: '04',
      name: 'Unlock',
      title: 'Escrow claim',
      value: `${cleared} / 3`,
      detail: 'targets cleared',
      detailTone: 'link' as const,
    },
  ]
}

/**
 * Map the live overview payload into the page model.
 * Unknown/missing numeric fields become 0 — never mock demo numbers.
 */
export function normalizeOverview(raw: unknown): OverviewViewModel {
  const root = asRecord(raw) ?? {}
  const data =
    asRecord(root.overview) ??
    asRecord(root.data) ??
    root

  const ambassador =
    asRecord(data.ambassador) ??
    asRecord(data.profile) ??
    asRecord(data.user) ??
    {}
  const earnings =
    asRecord(data.earnings) ??
    asRecord(data.rewards) ??
    asRecord(data.payouts) ??
    {}
  const escrow = asRecord(data.escrow) ?? asRecord(data.bonus) ?? {}
  const step =
    asRecord(data.step) ??
    asRecord(data.rank) ??
    asRecord(data.tier) ??
    {}
  const reward =
    asRecord(data.reward) ??
    asRecord(data.mission) ??
    asRecord(data.campaign) ??
    {}
  const progress =
    asRecord(data.progress) ??
    asRecord(data.targets) ??
    asRecord(data.stats) ??
    asRecord(data.metrics) ??
    asRecord(reward.targets) ??
    asRecord(reward.progress) ??
    data

  const containers = [progress, reward, data, ambassador]

  const targets = DEFAULT_TARGET_META.map(meta => {
    const pair = readTargetPair(containers, meta.aliases)
    return targetFrom(meta.label, pair?.current, pair?.goal, meta.goal)
  })

  const overallPercent = Math.round(
    targets.reduce((sum, target) => sum + target.percent, 0) / Math.max(targets.length, 1),
  )

  const referralCode = str(
    data.referral_code ??
      data.referralCode ??
      ambassador.referral_code ??
      ambassador.referralCode ??
      ambassador.code,
  )
  const referralLink = str(
    data.referral_link ??
      data.referralLink ??
      data.share_url ??
      data.shareUrl ??
      (referralCode ? `https://senseifi.io/r/${referralCode}` : ''),
  )

  const earningLinesRaw = Array.isArray(earnings.lines)
    ? earnings.lines
    : Array.isArray(earnings.breakdown)
      ? earnings.breakdown
      : Array.isArray(earnings.items)
        ? earnings.items
        : []

  const earningLines = earningLinesRaw.map((line, index) => {
    const row = asRecord(line) ?? {}
    return {
      label: str(row.label ?? row.name ?? row.description, `Line ${index + 1}`),
      amount: num(row.amount ?? row.value ?? row.total),
    }
  })

  const currentStep = Math.min(
    3,
    Math.max(1, Math.round(num(step.current ?? data.level ?? ambassador.level, 1))),
  )
  const levelName = str(
    ambassador.level_name ??
      ambassador.levelName ??
      ambassador.rank ??
      ambassador.title ??
      step.name ??
      data.level_name,
    currentStep === 1
      ? 'Rising Ambassador'
      : currentStep === 2
        ? 'Elite Ambassador'
        : 'Legendary Ambassador',
  )

  return {
    title: str(data.title, 'Overview'),
    subtitle: str(
      data.subtitle ?? data.description,
      'Your ambassador rank, unlocked rewards, and the mission still ahead.',
    ),
    ambassador: {
      name: levelName,
      level: str(
        ambassador.level_label ?? ambassador.levelLabel ?? data.level_label,
        `Level ${currentStep}`,
      ),
      rankProgress: num(
        data.rank_progress ?? data.rankProgress ?? reward.overall_percent ?? overallPercent,
        overallPercent,
      ),
      nextRank: str(
        ambassador.next_rank ?? ambassador.nextRank ?? step.next_rank ?? step.nextRank,
        currentStep >= 3 ? 'Max rank' : TIER_NAMES[currentStep] + ' Ambassador',
      ),
      xpLabel: str(data.xp_label ?? data.xpLabel, 'Mission progress'),
    },
    earnings: {
      total: num(earnings.total ?? earnings.amount ?? earnings.balance ?? data.total_earnings),
      lines: earningLines,
    },
    step: {
      current: currentStep,
      total: 3,
      name: levelName,
      tiers: TIER_NAMES.map((name, index) => ({
        name,
        amount: TIER_AMOUNTS[index],
        active: index === currentStep - 1,
        complete: index < currentStep - 1,
      })),
      nextUnlock: str(
        step.next_unlock ??
          step.nextUnlock ??
          reward.next_unlock ??
          reward.nextUnlock,
        `Clear all three ${TIER_NAMES[currentStep - 1]} targets to unlock the ${TIER_AMOUNTS[currentStep - 1]} escrow reward.`,
      ),
    },
    escrow: {
      amount: num(escrow.amount ?? escrow.locked ?? escrow.value),
      status: str(escrow.status, escrow.amount ? 'Funded · Locked' : '—'),
      detail: str(escrow.detail ?? escrow.note ?? escrow.description),
    },
    reward: {
      title: str(reward.title, `${TIER_NAMES[currentStep - 1]} mission`),
      status: str(reward.status, overallPercent >= 100 ? 'Complete' : 'In progress'),
      note: str(
        reward.note ?? reward.detail,
        'All three targets required. Signups alone will not unlock the reward.',
      ),
      overallPercent,
      targets,
    },
    referralLink,
    referralNote: str(
      data.referral_note ?? data.referralNote,
      'One account, one ambassador. Self-referrals and duplicates are blocked.',
    ),
    funnel: buildFunnel(targets),
    raw,
  }
}

export async function fetchAmbassadorOverview() {
  const result = await apiRequest<unknown>('/api/ambassador/overview', {
    method: 'GET',
    auth: true,
  })
  return normalizeOverview(result.data)
}
