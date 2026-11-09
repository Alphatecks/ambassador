import { overview as fallbackOverview } from '../models/overview.ts'
import { apiRequest } from './apiClient.ts'

export type OverviewTarget = {
  label: string
  current: number
  goal: number
  percent: number
  remaining: number
}

export type OverviewViewModel = typeof fallbackOverview

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null
}

function num(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function str(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function targetFrom(
  label: string,
  currentRaw: unknown,
  goalRaw: unknown,
  fallback: OverviewTarget,
): OverviewTarget {
  const current = num(currentRaw, fallback.current)
  const goal = Math.max(1, num(goalRaw, fallback.goal))
  const percent = Math.min(100, Math.round((current / goal) * 100))
  return {
    label,
    current,
    goal,
    percent,
    remaining: Math.max(0, goal - current),
  }
}

function pickTarget(
  source: Record<string, unknown> | null,
  keys: string[],
): { current: unknown; goal: unknown } | null {
  if (!source) return null
  for (const key of keys) {
    const value = asRecord(source[key])
    if (!value) continue
    return {
      current: value.current ?? value.count ?? value.value ?? value.progress,
      goal: value.goal ?? value.target ?? value.required ?? value.limit,
    }
  }
  return null
}

/**
 * Normalize unknown overview payloads into the page view model.
 * Missing fields fall back to the existing mock so the UI stays stable.
 */
export function normalizeOverview(raw: unknown): OverviewViewModel {
  const data = asRecord(raw) ?? {}
  const ambassador = asRecord(data.ambassador) ?? asRecord(data.profile) ?? {}
  const earnings = asRecord(data.earnings) ?? asRecord(data.rewards) ?? {}
  const escrow = asRecord(data.escrow) ?? {}
  const step = asRecord(data.step) ?? asRecord(data.rank) ?? {}
  const reward = asRecord(data.reward) ?? asRecord(data.mission) ?? {}
  const progress =
    asRecord(data.progress) ??
    asRecord(data.targets) ??
    asRecord(reward.targets) ??
    asRecord(data.metrics) ??
    {}

  const fallbackTargets = fallbackOverview.reward.targets
  const registrations =
    pickTarget(progress, [
      'verified_registrations',
      'registrations',
      'signups',
      'verifiedSignups',
    ]) ?? {
      current: fallbackTargets[0].current,
      goal: fallbackTargets[0].goal,
    }
  const wallets =
    pickTarget(progress, [
      'activated_wallets',
      'wallets',
      'wallet_activations',
      'activatedWallets',
    ]) ?? {
      current: fallbackTargets[1].current,
      goal: fallbackTargets[1].goal,
    }
  const subscribers =
    pickTarget(progress, [
      'paid_subscribers',
      'subscribers',
      'subscriptions',
      'new_paid_subscribers',
    ]) ?? {
      current: fallbackTargets[2].current,
      goal: fallbackTargets[2].goal,
    }

  const targets = [
    targetFrom(
      fallbackTargets[0].label,
      registrations.current,
      registrations.goal,
      fallbackTargets[0],
    ),
    targetFrom(
      fallbackTargets[1].label,
      wallets.current,
      wallets.goal,
      fallbackTargets[1],
    ),
    targetFrom(
      fallbackTargets[2].label,
      subscribers.current,
      subscribers.goal,
      fallbackTargets[2],
    ),
  ]

  const overallPercent = Math.round(
    targets.reduce((sum, target) => sum + target.percent, 0) / targets.length,
  )
  const cleared = targets.filter(target => target.current >= target.goal).length

  const referralCode = str(
    data.referral_code ??
      data.referralCode ??
      ambassador.referral_code ??
      ambassador.referralCode,
  )
  const referralLink = str(
    data.referral_link ??
      data.referralLink ??
      (referralCode ? `senseifi.io/r/${referralCode}` : ''),
    fallbackOverview.referralLink,
  )

  const earningLinesRaw = Array.isArray(earnings.lines)
    ? earnings.lines
    : Array.isArray(earnings.breakdown)
      ? earnings.breakdown
      : null

  const earningLines = earningLinesRaw
    ? earningLinesRaw.map((line, index) => {
        const row = asRecord(line) ?? {}
        return {
          label: str(row.label ?? row.name, `Line ${index + 1}`),
          amount: num(row.amount ?? row.value),
        }
      })
    : fallbackOverview.earnings.lines

  const currentStep = num(step.current ?? data.level ?? ambassador.level, 1)
  const levelName = str(
    ambassador.level_name ??
      ambassador.levelName ??
      ambassador.rank ??
      step.name,
    fallbackOverview.ambassador.name,
  )

  return {
    ...fallbackOverview,
    ambassador: {
      ...fallbackOverview.ambassador,
      name: levelName,
      level: str(
        ambassador.level_label ?? ambassador.levelLabel,
        `Level ${currentStep}`,
      ),
      rankProgress: num(
        data.rank_progress ?? data.rankProgress ?? overallPercent,
        overallPercent,
      ),
      nextRank: str(
        ambassador.next_rank ?? ambassador.nextRank ?? step.next_rank,
        fallbackOverview.ambassador.nextRank,
      ),
    },
    earnings: {
      total: num(earnings.total ?? earnings.amount, fallbackOverview.earnings.total),
      lines: earningLines,
    },
    step: {
      ...fallbackOverview.step,
      current: currentStep,
      name: levelName,
      nextUnlock: str(
        step.next_unlock ?? step.nextUnlock ?? reward.next_unlock,
        fallbackOverview.step.nextUnlock,
      ),
    },
    escrow: {
      amount: num(escrow.amount, fallbackOverview.escrow.amount),
      status: str(escrow.status, fallbackOverview.escrow.status),
      detail: str(escrow.detail ?? escrow.note, fallbackOverview.escrow.detail),
    },
    reward: {
      ...fallbackOverview.reward,
      title: str(reward.title, fallbackOverview.reward.title),
      status: str(reward.status, fallbackOverview.reward.status),
      note: str(reward.note ?? reward.detail, fallbackOverview.reward.note),
      overallPercent,
      targets,
    },
    referralLink,
    referralNote: str(
      data.referral_note ?? data.referralNote,
      fallbackOverview.referralNote,
    ),
    funnel: [
      {
        index: '01',
        name: 'Attract',
        title: 'Verified signups',
        value: String(targets[0].current),
        detail: `of ${targets[0].goal} needed`,
        detailTone: 'muted' as const,
      },
      {
        index: '02',
        name: 'Activate',
        title: 'Wallets live',
        value: String(targets[1].current),
        detail: `of ${targets[1].goal} needed`,
        detailTone: 'muted' as const,
      },
      {
        index: '03',
        name: 'Convert',
        title: 'Paid subs',
        value: String(targets[2].current),
        detail: `of ${targets[2].goal} needed`,
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
    ],
  }
}

export async function fetchAmbassadorOverview() {
  const result = await apiRequest<unknown>('/api/ambassador/overview', {
    method: 'GET',
    auth: true,
  })
  return normalizeOverview(result.data)
}
