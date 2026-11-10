import {
  type ReferralFilter,
  type ReferralFunnelStep,
  type ReferralTimelineEvent,
  type ReferralUser,
  referrals as referralCopy,
} from '../models/referrals.ts'
import { saveAmbassadorSession, readAmbassadorSession } from './ambassadorAuth.ts'
import { apiRequest } from './apiClient.ts'

export type ReferralsPageData = {
  title: string
  subtitle: string
  ambassadorLevel: string
  referralCode: string
  referralLink: string
  referralNote: string
  funnel: ReferralFunnelStep[]
  filters: Array<{ id: ReferralFilter; label: string }>
  filter: ReferralFilter
  page: number
  perPage: number
  total: number
  totalPages: number
  users: ReferralUser[]
  selected: ReferralUser | null
  timeline: ReferralTimelineEvent[]
  timelineNote: string
  ledgerLabel: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function str(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function num(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function bool(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function asFilter(value: unknown): ReferralFilter {
  const raw = str(value, 'all').toLowerCase()
  if (raw === 'activated' || raw === 'activation') return 'activated'
  if (raw === 'paid' || raw === 'first_paid') return 'paid'
  return 'all'
}

function asSubscription(value: unknown): ReferralUser['subscription'] {
  return /paid/i.test(str(value)) ? 'Paid' : 'Free'
}

function normalizeUser(raw: unknown): ReferralUser | null {
  const row = asRecord(raw)
  if (!row) return null
  const id = str(row.id ?? row.referred_key ?? row.referredKey ?? row.user_id)
  if (!id) return null
  return {
    id,
    label: str(row.label, id),
    walletConnected: bool(
      row.wallet_connected ?? row.walletConnected ?? row.has_activation,
      false,
    ),
    subscription: asSubscription(row.subscription),
    joined: str(row.joined ?? row.joined_at ?? row.joinedAt, '—'),
    status: str(row.status, str(row.joined, '—')),
  }
}

function normalizeTimeline(raw: unknown): ReferralTimelineEvent[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(item => {
      const row = asRecord(item)
      if (!row) return null
      const title = str(row.title ?? row.label ?? row.event_type ?? row.eventType)
      if (!title) return null
      return {
        id: str(row.id, title),
        title,
        detail: str(row.detail ?? row.description ?? row.amount_usd ?? row.amountUsd),
      }
    })
    .filter((item): item is ReferralTimelineEvent => Boolean(item))
}

function normalizeFunnel(raw: unknown): ReferralFunnelStep[] {
  if (!Array.isArray(raw)) return referralCopy.funnel
  const steps = raw
    .map(item => {
      const row = asRecord(item)
      if (!row) return null
      const label = str(row.label ?? row.name ?? row.id)
      if (!label) return null
      return {
        label,
        value: str(row.value, String(num(row.count))),
        detail: str(row.detail),
      }
    })
    .filter((item): item is ReferralFunnelStep => Boolean(item))
  return steps.length ? steps : referralCopy.funnel
}

function normalizeFilters(raw: unknown) {
  if (!Array.isArray(raw)) return referralCopy.filters
  const filters = raw
    .map(item => {
      const row = asRecord(item)
      if (!row) return null
      const id = asFilter(row.id ?? row.value ?? row.filter)
      return { id, label: str(row.label, id === 'all' ? 'All' : id[0].toUpperCase() + id.slice(1)) }
    })
    .filter((item): item is { id: ReferralFilter; label: string } => Boolean(item))
  return filters.length ? filters : referralCopy.filters
}

export function emptyReferralsPage(): ReferralsPageData {
  return {
    title: referralCopy.title,
    subtitle: referralCopy.subtitle,
    ambassadorLevel: referralCopy.ambassador.level,
    referralCode: '',
    referralLink: '',
    referralNote: referralCopy.referralNote,
    funnel: referralCopy.funnel.map(step => ({ ...step, value: '0' })),
    filters: referralCopy.filters,
    filter: 'all',
    page: 1,
    perPage: referralCopy.pageSize,
    total: 0,
    totalPages: 1,
    users: [],
    selected: null,
    timeline: [],
    timelineNote: referralCopy.timelineNote,
    ledgerLabel: 'View in commission ledger',
  }
}

export function normalizeReferrals(raw: unknown): ReferralsPageData {
  const data = asRecord(raw) ?? {}
  const ambassador = asRecord(data.ambassador) ?? {}
  const selectedRaw =
    asRecord(data.selected) ??
    asRecord(data.selected_referral) ??
    asRecord(data.selectedReferral)
  const users = Array.isArray(data.users)
    ? data.users
        .map(normalizeUser)
        .filter((user): user is ReferralUser => Boolean(user))
    : []
  const selected = selectedRaw ? normalizeUser(selectedRaw) : users[0] ?? null
  const timeline = normalizeTimeline(
    selectedRaw?.timeline ?? data.timeline ?? data.events,
  )

  return {
    title: str(data.title, referralCopy.title),
    subtitle: str(data.subtitle, referralCopy.subtitle),
    ambassadorLevel: str(
      ambassador.level ?? data.level,
      referralCopy.ambassador.level,
    ),
    referralCode: str(
      data.referral_code ?? data.referralCode ?? ambassador.referral_code,
    ),
    referralLink: str(data.referral_link ?? data.referralLink),
    referralNote: str(data.referral_note ?? data.referralNote, referralCopy.referralNote),
    funnel: normalizeFunnel(data.funnel),
    filters: normalizeFilters(data.filters),
    filter: asFilter(data.filter),
    page: Math.max(1, num(data.page, 1)),
    perPage: Math.max(1, num(data.per_page ?? data.perPage, referralCopy.pageSize)),
    total: Math.max(0, num(data.total)),
    totalPages: Math.max(1, num(data.total_pages ?? data.totalPages, 1)),
    users,
    selected,
    timeline,
    timelineNote: str(data.timeline_note ?? data.timelineNote, referralCopy.timelineNote),
    ledgerLabel: str(data.ledger_label ?? data.ledgerLabel, 'View in commission ledger'),
  }
}

export type FetchReferralsInput = {
  filter?: ReferralFilter
  page?: number
  selected?: string
  perPage?: number
}

export async function fetchAmbassadorReferrals(input: FetchReferralsInput = {}) {
  const params = new URLSearchParams()
  params.set('filter', input.filter ?? 'all')
  params.set('page', String(Math.max(1, input.page ?? 1)))
  if (input.perPage) params.set('per_page', String(input.perPage))
  if (input.selected?.trim()) params.set('selected', input.selected.trim())

  const result = await apiRequest<unknown>(
    `/api/ambassador/referrals?${params.toString()}`,
    { auth: true },
  )
  const page = normalizeReferrals(result.data)

  if (page.referralLink || page.referralCode) {
    const existing = readAmbassadorSession()
    if (existing) {
      saveAmbassadorSession({
        ...existing,
        referralCode: page.referralCode || existing.referralCode,
        referralLink: page.referralLink || existing.referralLink,
      })
    }
  }

  return page
}

export async function fetchReferralTimeline(referredKey: string) {
  const key = referredKey.trim()
  if (!key) throw new Error('Missing referral user.')
  const result = await apiRequest<unknown>(
    `/api/ambassador/referrals/users/${encodeURIComponent(key)}`,
    { auth: true },
  )
  const selected = asRecord(result.data) ?? {}
  const user = normalizeUser(selected)
  return {
    selected: user,
    timeline: normalizeTimeline(selected.timeline ?? selected.events),
  }
}
