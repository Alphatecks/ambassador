import {
  type RewardEntry,
  type RewardFilter,
  type RewardRule,
  type RewardStatus,
  rewards as rewardsCopy,
} from '../models/rewards.ts'
import { apiRequest } from './apiClient.ts'

export type RewardsPageData = {
  title: string
  subtitle: string
  ambassadorLevel: string
  availableBalanceUsd: string
  pendingBalanceUsd: string
  filters: Array<{ id: RewardFilter; label: string }>
  filter: RewardFilter
  page: number
  perPage: number
  total: number
  totalPages: number
  entries: RewardEntry[]
  rules: RewardRule[]
  example: string
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

function asFilter(value: unknown): RewardFilter {
  const raw = str(value, 'all').toLowerCase()
  if (raw === 'pending' || raw === 'held') return 'pending'
  if (raw === 'approved' || raw === 'available' || raw === 'released') {
    return 'approved'
  }
  return 'all'
}

function asStatus(value: unknown): RewardStatus {
  const raw = str(value).toLowerCase()
  return raw === 'pending' || raw === 'held' ? 'pending' : 'approved'
}

function normalizeEntry(raw: unknown): RewardEntry | null {
  const row = asRecord(raw)
  if (!row) return null
  const id = str(row.id)
  if (!id) return null
  const amountRaw = str(row.amount ?? row.amount_usd ?? row.amountUsd, '0')
  const amount = amountRaw.startsWith('+')
    ? amountRaw
    : amountRaw.startsWith('$')
      ? `+${amountRaw}`
      : `+$${amountRaw.replace(/^\$/, '')}`

  return {
    id,
    date: str(row.date ?? row.created_at ?? row.createdAt, '—'),
    event: str(row.event ?? row.event_type ?? row.eventType, 'Reward'),
    user: str(row.user ?? row.label ?? row.referred_key ?? row.referredKey, '—'),
    amount,
    status: asStatus(row.status),
    note: str(row.note ?? row.status_label ?? row.statusLabel),
  }
}

function normalizeRules(raw: unknown): RewardRule[] {
  if (!Array.isArray(raw)) return rewardsCopy.rules
  const rules = raw
    .map(item => {
      const row = asRecord(item)
      if (!row) return null
      const title = str(row.title ?? row.label)
      if (!title) return null
      return {
        title,
        value: str(row.value),
        detail: str(row.detail ?? row.description),
      }
    })
    .filter((item): item is RewardRule => Boolean(item))
  return rules.length ? rules : rewardsCopy.rules
}

function normalizeFilters(raw: unknown) {
  if (!Array.isArray(raw)) return rewardsCopy.filters
  const filters = raw
    .map(item => {
      const row = asRecord(item)
      if (!row) return null
      const id = asFilter(row.id ?? row.value ?? row.filter)
      return {
        id,
        label: str(
          row.label,
          id === 'all' ? 'All' : id[0].toUpperCase() + id.slice(1),
        ),
      }
    })
    .filter((item): item is { id: RewardFilter; label: string } => Boolean(item))
  return filters.length ? filters : rewardsCopy.filters
}

export function emptyRewardsPage(): RewardsPageData {
  return {
    title: rewardsCopy.title,
    subtitle: rewardsCopy.subtitle,
    ambassadorLevel: rewardsCopy.ambassador.level,
    availableBalanceUsd: '0.00',
    pendingBalanceUsd: '0.00',
    filters: rewardsCopy.filters,
    filter: 'all',
    page: 1,
    perPage: 50,
    total: 0,
    totalPages: 1,
    entries: [],
    rules: rewardsCopy.rules,
    example: rewardsCopy.example,
  }
}

export function normalizeRewards(raw: unknown): RewardsPageData {
  const data = asRecord(raw) ?? {}
  const ambassador = asRecord(data.ambassador) ?? {}
  const entriesSource = data.entries ?? data.rewards ?? data.items ?? data.ledger
  const entries = Array.isArray(entriesSource)
    ? entriesSource
        .map(normalizeEntry)
        .filter((entry): entry is RewardEntry => Boolean(entry))
    : []

  return {
    title: str(data.title, rewardsCopy.title),
    subtitle: str(data.subtitle, rewardsCopy.subtitle),
    ambassadorLevel: str(
      ambassador.level ?? data.level,
      rewardsCopy.ambassador.level,
    ),
    availableBalanceUsd: str(
      data.available_balance_usd ?? data.availableBalanceUsd,
      '0.00',
    ),
    pendingBalanceUsd: str(
      data.pending_balance_usd ?? data.pendingBalanceUsd,
      '0.00',
    ),
    filters: normalizeFilters(data.filters),
    filter: asFilter(data.filter),
    page: Math.max(1, num(data.page, 1)),
    perPage: Math.max(1, num(data.per_page ?? data.perPage, 50)),
    total: Math.max(0, num(data.total)),
    totalPages: Math.max(1, num(data.total_pages ?? data.totalPages, 1)),
    entries,
    rules: normalizeRules(data.rules),
    example: str(data.example, rewardsCopy.example),
  }
}

export type FetchRewardsInput = {
  filter?: RewardFilter
  page?: number
  perPage?: number
}

export async function fetchAmbassadorRewards(input: FetchRewardsInput = {}) {
  const params = new URLSearchParams()
  params.set('filter', input.filter ?? 'all')
  params.set('page', String(Math.max(1, input.page ?? 1)))
  if (input.perPage) params.set('per_page', String(input.perPage))

  const result = await apiRequest<unknown>(
    `/api/ambassador/rewards?${params.toString()}`,
    { auth: true },
  )
  return normalizeRewards(result.data)
}
