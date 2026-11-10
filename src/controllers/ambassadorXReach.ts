import {
  formatCount,
  type XPost,
  type XPostFilter,
  type XPostStatus,
  type XReachRule,
  type XReachStat,
  xReach as xReachCopy,
} from '../models/xReach.ts'
import { apiRequest } from './apiClient.ts'

export type XReachPageData = {
  title: string
  subtitle: string
  ambassadorLevel: string
  xConnected: boolean
  canSync: boolean
  syncHint: string
  lastSyncedAt: string
  stats: XReachStat[]
  filters: Array<{ id: XPostFilter; label: string }>
  filter: XPostFilter
  page: number
  perPage: number
  total: number
  totalPages: number
  entries: XPost[]
  rules: XReachRule[]
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

function bool(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function asFilter(value: unknown): XPostFilter {
  const raw = str(value, 'all').toLowerCase()
  if (raw === 'tracked' || raw === 'synced') return 'tracked'
  if (raw === 'pending' || raw === 'syncing') return 'pending'
  return 'all'
}

function asStatus(value: unknown): XPostStatus {
  const raw = str(value).toLowerCase()
  return raw === 'pending' || raw === 'syncing' ? 'pending' : 'tracked'
}

function normalizeStat(raw: unknown): XReachStat | null {
  const row = asRecord(raw)
  if (!row) return null
  const id = str(row.id ?? row.label)
  if (!id) return null
  return {
    id,
    label: str(row.label, id),
    value: str(row.value, '0'),
    detail: str(row.detail),
  }
}

function normalizeEntry(raw: unknown): XPost | null {
  const row = asRecord(raw)
  if (!row) return null
  const id = str(row.id ?? row.tweet_id ?? row.tweetId)
  if (!id) return null
  const likes = num(row.likes)
  const reposts = num(row.reposts)
  const replies = num(row.replies)
  return {
    id,
    date: str(row.date ?? row.posted_at ?? row.postedAt, '—'),
    preview: str(row.preview ?? row.text ?? row.title, 'Post'),
    url: str(row.url),
    impressions: num(row.impressions),
    likes,
    reposts,
    replies,
    engagement: num(row.engagement, likes + reposts + replies),
    engagementDetail: str(
      row.engagement_detail ?? row.engagementDetail,
      `${likes} likes · ${reposts} reposts · ${replies} replies`,
    ),
    status: asStatus(row.status),
    note: str(row.note),
  }
}

function normalizeRules(raw: unknown): XReachRule[] {
  if (!Array.isArray(raw)) return xReachCopy.rules
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
    .filter((item): item is XReachRule => Boolean(item))
  return rules.length ? rules : xReachCopy.rules
}

function normalizeFilters(raw: unknown) {
  if (!Array.isArray(raw)) return xReachCopy.filters
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
    .filter((item): item is { id: XPostFilter; label: string } => Boolean(item))
  return filters.length ? filters : xReachCopy.filters
}

function normalizeStats(raw: unknown): XReachStat[] {
  if (!Array.isArray(raw)) return xReachCopy.stats.map(stat => ({ ...stat, value: '0' }))
  const stats = raw
    .map(normalizeStat)
    .filter((item): item is XReachStat => Boolean(item))
  return stats.length
    ? stats
    : xReachCopy.stats.map(stat => ({ ...stat, value: '0' }))
}

export function emptyXReachPage(): XReachPageData {
  return {
    title: xReachCopy.title,
    subtitle: xReachCopy.subtitle,
    ambassadorLevel: 'Level 1',
    xConnected: false,
    canSync: false,
    syncHint: '',
    lastSyncedAt: '',
    stats: xReachCopy.stats.map(stat => ({ ...stat, value: '0' })),
    filters: xReachCopy.filters,
    filter: 'all',
    page: 1,
    perPage: 50,
    total: 0,
    totalPages: 1,
    entries: [],
    rules: xReachCopy.rules,
    example: xReachCopy.example,
  }
}

export function normalizeXReach(raw: unknown): XReachPageData {
  const data = asRecord(raw) ?? {}
  const ambassador = asRecord(data.ambassador) ?? {}
  const entriesSource = data.entries ?? data.posts ?? data.items
  const entries = Array.isArray(entriesSource)
    ? entriesSource
        .map(normalizeEntry)
        .filter((entry): entry is XPost => Boolean(entry))
    : []

  return {
    title: str(data.title, xReachCopy.title),
    subtitle: str(data.subtitle, xReachCopy.subtitle),
    ambassadorLevel: str(ambassador.level ?? data.level, 'Level 1'),
    xConnected: bool(data.x_connected ?? data.xConnected, true),
    canSync: bool(data.can_sync ?? data.canSync, false),
    syncHint: str(data.sync_hint ?? data.syncHint),
    lastSyncedAt: str(data.last_synced_at ?? data.lastSyncedAt),
    stats: normalizeStats(data.stats),
    filters: normalizeFilters(data.filters),
    filter: asFilter(data.filter),
    page: Math.max(1, num(data.page, 1)),
    perPage: Math.max(1, num(data.per_page ?? data.perPage, 50)),
    total: Math.max(0, num(data.total)),
    totalPages: Math.max(1, num(data.total_pages ?? data.totalPages, 1)),
    entries,
    rules: normalizeRules(data.rules),
    example: str(data.example, xReachCopy.example),
  }
}

export type FetchXReachInput = {
  filter?: XPostFilter
  page?: number
  perPage?: number
  refresh?: boolean
}

export async function fetchAmbassadorXReach(input: FetchXReachInput = {}) {
  const params = new URLSearchParams()
  params.set('filter', input.filter ?? 'all')
  params.set('page', String(Math.max(1, input.page ?? 1)))
  params.set('per_page', String(Math.max(1, input.perPage ?? 50)))
  if (input.refresh) params.set('refresh', '1')

  const result = await apiRequest<unknown>(
    `/api/ambassador/x-reach?${params.toString()}`,
    { auth: true },
  )
  return normalizeXReach(result.data)
}

export async function syncAmbassadorXReach() {
  const result = await apiRequest<unknown>('/api/ambassador/x-reach/sync', {
    method: 'POST',
    auth: true,
  })
  return normalizeXReach(result.data)
}

export { formatCount }
